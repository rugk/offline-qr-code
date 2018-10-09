/**
 * Load, save and apply options to HTML options page.
 *
 * @module modules/OptionHandler
 */
import * as AddonSettings from "/common/modules/AddonSettings.js";
import { MESSAGE_LEVEL } from "/common/modules/data/MessageLevel.js";
import * as Logger from "/common/modules/Logger.js";
import * as MessageHandler from "/common/modules/MessageHandler.js";

let managedInfoIsShown = false;

let rememberedOptions;
let lastOptionsBeforeReset;
const triggers = {
    onSave: [],
    onChange: [],
    onUpdate: []
};

/**
 * Applies option to element.
 *
 * @function
 * @private
 * @param  {string} option string ob object ID
 * @param  {string|null} optionGroup optiom group, if it is used
 * @param  {HTMLElement} elOption where to apply feature
 * @param  {Object|undefined} optionValues object values
 * @returns {void}
 */
function applyOptionToElement(option, optionGroup, elOption, optionValues) {
    let optionValue;
    // get default value if value is not passed
    if (!optionValues.hasOwnProperty(option) && !optionValues.hasOwnProperty(optionGroup)) {
        if (optionGroup === null) {
            optionValue = AddonSettings.getDefaultValue(option);
        } else {
            optionValue = AddonSettings.getDefaultValue(optionGroup)[option];
        }

        Logger.logInfo("got default value for applying option", option, ":", optionValue);

        // if still no default value, try to use HTML defaults, i.e. do not set option
        if (optionValue === undefined) {
            return;
        }
    } else {
        // as value is present, get value from settings array
        if (optionGroup === null) {
            optionValue = optionValues[option];
        } else {
            const allOptionsInGroup = optionValues[optionGroup];
            optionValue = optionValues[optionGroup][option];

            // save options if needed
            if (!rememberedOptions.hasOwnProperty(optionGroup)) {
                rememberedOptions[optionGroup] = allOptionsInGroup;
            }
        }
    }

    // custom handling for special option types
    switch (elOption.getAttribute("type") || elOption.getAttribute("data-type")) {
    case "checkbox":
        if (optionValue === null) {
            elOption.indeterminate = true;
        } else {
            elOption.checked = (optionValue === true);
        }
        break;
    case "radiogroup": {
        const radioChilds = elOption.getElementsByTagName("input");

        for (const radioElement of radioChilds) {
            if (radioElement.getAttribute("type") === "radio" &&
                radioElement.getAttribute("value") === optionValue) {
                radioElement.setAttribute("checked", "");
            }
        }
        break;
    }
    default:
        // set value
        elOption.value = optionValue;
    }
}

/**
 * Returns the option value from an element.
 *
 * @function
 * @private
 * @param  {HTMLElement} elOption the element to read option from
 * @returns {Object} the option value
 */
function getOptionFromElement(elOption) {
    let optionValue;

    // custom handling for special option types
    switch (elOption.getAttribute("type") || elOption.getAttribute("data-type")) {
    case "checkbox":
        if (elOption.indeterminate === true) {
            optionValue = null;
        } else {
            optionValue = elOption.checked;
        }
        break;
    case "radiogroup":
        // use our custom "selected" method, which contains the selected element
        if (elOption.hasOwnProperty("selected")) {
            optionValue = elOption.selected.value;
        } else {
            // go through all possible elements and decide, which is checked
            const radioChilds = elOption.getElementsByTagName("input");

            for (const radioElement of radioChilds) {
                if (radioElement.getAttribute("type") === "radio" &&
                        radioElement.hasAttribute("checked")) {
                    optionValue = radioElement.value;
                }
            }
        }
        break;
    default:
        optionValue = elOption.value;
    }

    return optionValue;
}

/**
 * Returns the option ID and value or all values from an option group associated to it.
 *
 * @function
 * @private
 * @param  {HTMLElement} elOption the element to read option from
 * @returns {Array.<string, Object>} first the ID, then the option value
 */
function getIdAndOptionsFromElement(elOption) {
    let option, optionValue;

    // if option has a group assigned, first fetch all options of the group for saving
    if (elOption.hasAttribute("data-optiongroup")) {
        const optionGroup = elOption.getAttribute("data-optiongroup");

        // if options are cached/saved use them to prevent them from getting lost
        if (rememberedOptions.hasOwnProperty(optionGroup)) {
            optionValue = rememberedOptions[optionGroup];
        } else {
            // otherwise just init empty array
            optionValue = {};
        }

        document.querySelectorAll(`[data-optiongroup=${optionGroup}]`).forEach((elCurrentOption) => {
            optionValue[elCurrentOption.id] = getOptionFromElement(elCurrentOption);
        });

        // use group name as ID for saving
        option = optionGroup;
    } else {
        // use ID for saving
        option = elOption.id;
        optionValue = getOptionFromElement(elOption);
    }

    return [option, optionValue];
}

/**
 * Executes special handling for applying certain settings.
 *
 * E.g. when a setting is saved, it executes to apply some options live, so the
 * user immediately sees the change or the change is immediately applied.
 * If no parameters are passed, this gets and applies all options.
 *
 * @function
 * @private
 * @param  {string} [option]
 * @param  {Object} [optionValue] will be automatically retrieved, if not given
 * @returns {Promise} Promise only if called without parameters
 */
async function applyOptionLive(option, optionValue) {
    if (option === undefined) {
        Logger.logInfo("applying all options live");

        triggers.onSave.forEach((trigger) => {
            applyOptionLive(trigger.option);
        });
    }

    // get option value, if needed
    if (optionValue === undefined) {
        optionValue = await AddonSettings.get(option);
    }

    Logger.logInfo("applyOptionLive:", option, optionValue);

    // run all registered triggers for that option
    triggers.onSave.filter((trigger) => trigger.option === option).forEach((trigger) => {
        trigger.triggerFunc(optionValue, option);
    });
}

/**
 * Triggered by "trigger-on-…" classes.
 *
 * Can be used to do do some stuff per option, but do not save the option in
 * contrast to when {@link applyOptionLive()} is usually called.
 *
 * @function
 * @private
 * @param  {Event} event
 * @returns {void}
 * @throws {Error}
 */
function customOptionTrigger(event) {
    const elOption = event.target;

    const [option, optionValue] = getIdAndOptionsFromElement(elOption);

    // get trigger type by event type
    let triggerType;
    switch (event.type) {
    case "input":
        triggerType = "onUpdate";
        break;
    case "change":
        triggerType = "onChange";
        break;
    default:
        throw new Error("invalid event type attached");
    }

    // run all registered triggers for that option
    triggers[triggerType].filter((trigger) => trigger.option === option).forEach((trigger) => {
        trigger.triggerFunc(optionValue, option, event);
    });
}

/**
 * Registers a trigger of any type.
 *
 * @function
 * @private
 * @param  {string} triggerType
 * @param  {string} optionTrigger
 * @param  {function} functionToTrigger
 * @returns {void}
 */
export function registerTrigger(triggerType, optionTrigger, functionToTrigger) {
    triggers[triggerType].push({
        option: optionTrigger,
        triggerFunc: functionToTrigger
    });
}

/**
 * Registers a save trigger.
 * The trigger get the values (optionValue, option) passed as parameters.
 *
 * @public
 * @function
 * @param  {string} optionTrigger
 * @param  {function} functionToTrigger
 * @returns {void}
 */
export function registerSaveTrigger(optionTrigger, functionToTrigger) {
    registerTrigger("onSave", optionTrigger, functionToTrigger);
}

/**
 * Registers an update trigger.
 *
 * This trigger is executed, when the option value is updated by the user, and thus, usually
 * saved. However, it does not get the new value yet.
 * The trigger get the values (optionValue, option, event) passed as parameters.
 *
 * @public
 * @function
 * @param  {string} optionTrigger
 * @param  {function} functionToTrigger
 * @returns {void}
 */
export function registerUpdateTrigger(optionTrigger, functionToTrigger) {
    registerTrigger("onUpdate", optionTrigger, functionToTrigger);
}

/**
 * Registers an change trigger.
 *
 * This trigger is executed, when the option value is changed by the user, but not
 * (necessarily) saved. Internally, it binds to the "input" event.
 *
 * @public
 * @function
 * @param  {string} optionTrigger
 * @param  {function} functionToTrigger
 * @returns {void}
 */
export function registerChangeTrigger(optionTrigger, functionToTrigger) {
    registerTrigger("onChange", optionTrigger, functionToTrigger);
}

/**
 * Saves all settings.
 *
 * @function
 * @private
 * @param  {Object} event
 * @returns {void}
 */
function saveOption(event) {
    let elOption = event.target;

    // radio options need special handling, use (closest) parent
    if (elOption.getAttribute("type") === "radio") {
        elOption = elOption.closest("[data-type=radiogroup]");
        elOption.selected = event.target;
    }

    // do not save if managed
    if (elOption.hasAttribute("disabled")) {
        Logger.logInfo(elOption, "is disabled, ignore sync setting");
        return;
    }

    const [option, optionValue] = getIdAndOptionsFromElement(elOption);

    Logger.logInfo("save option", elOption, option, optionValue);

    applyOptionLive(option, optionValue);

    browser.storage.sync.set({
        [option]: optionValue
    }).catch((error) => {
        Logger.logError("could not save option", option, ": ", error);
        MessageHandler.showError("couldNotSaveOption", true);
    });
}

/**
 * Saves all settings.
 *
 * @function
 * @private
 * @returns {void}
 */
function showManagedInfo() {
    // prevent re-showings for multiple options
    if (managedInfoIsShown) {
        // already shown
        return;
    }

    MessageHandler.showInfo("someSettingsAreManaged", false);
    managedInfoIsShown = true;
}

/**
 * Restores the managed options by administrators.
 *
 * They override users selection, so the user control is disabled.
 *
 * @function
 * @private
 * @param  {string} option name of the option
 * @param  {string|null|undefined} optionGroup name of the option group,
 *                                             undefined will automatically
 *                                             detect the element
 * @param  {HTMLElement|null} elOption optional element of the option, will
 *                                     be autodetected otherwise
 * @returns {Promise}
 */
function setManagedOption(option, optionGroup, elOption) {
    if (!elOption) {
        elOption = document.getElementById(option);
    }

    if (optionGroup === undefined && elOption.hasAttribute("data-optiongroup")) {
        optionGroup = elOption.getAttribute("data-optiongroup");
    }

    let gettingOption;
    if (optionGroup == null) {
        gettingOption = browser.storage.managed.get(option);
    } else {
        gettingOption = browser.storage.managed.get(optionGroup);
    }

    return gettingOption.then((res) => {
        showManagedInfo();

        Logger.logInfo("managed config found", res, elOption);

        applyOptionToElement(option, optionGroup, elOption, res);
        // and disable control
        elOption.setAttribute("disabled", "");
        elOption.setAttribute("title", browser.i18n.getMessage("optionIsDisabledBecauseManaged"));
        // could also set readonly elOption.setAttribute("readonly", "") //TODO: test
    });
}

/**
 * Display option in option page.
 *
 * If the option is not saved already, it uses the default from common.js.
 *
 * @public
 * @function
 * @param  {string} option name of the option
 * @param  {string|null|undefined} optionGroup name of the option group,
 *                                             undefined will automatically
 *                                             detect the element
 * @param  {HTMLElement|null} elOption optional element of the option, will
 *                                     be autodetected otherwise
 * @param  {bool} ignoreDisabled set to true to ignore disabled check
 * @returns {Promise|void}
 */
export function setOption(option, optionGroup, elOption, ignoreDisabled) {
    if (!elOption) {
        elOption = document.getElementById(option);
    }

    if (optionGroup === undefined && elOption.hasAttribute("data-optiongroup")) {
        optionGroup = elOption.getAttribute("data-optiongroup");
    }

    let gettingOption;
    if (optionGroup == null) {
        gettingOption = browser.storage.sync.get(option);
    } else {
        gettingOption = browser.storage.sync.get(optionGroup);
    }

    return gettingOption.then((res) => {
        Logger.logInfo("sync config found", res, elOption);

        // do not modify if managed
        if (ignoreDisabled !== true && elOption.hasAttribute("disabled")) {
            Logger.logInfo(option, "is disabled, ignore sync setting");
            return;
        }

        applyOptionToElement(option, optionGroup, elOption, res);
    });
}

/**
 * Loads all options of the page.
 *
 * @function
 * @private
 * @returns {Promise}
 */
function loadOptions() {
    // reset remembered options to prevent arkward errors when reloading of the options happens
    rememberedOptions = {};
    const allPromises = [];

    // needs to reset some custom options, as they may prevent (correctly) loading settings later
    const elQrCodeSize = document.getElementById("size");
    elQrCodeSize.removeAttribute("disabled");

    // set each option
    document.querySelectorAll(".setting").forEach((currentElem, index) => {
        const elementId = currentElem.id;
        let optionGroup = null;
        if (currentElem.hasAttribute("data-optiongroup")) {
            optionGroup = currentElem.getAttribute("data-optiongroup");
        }

        allPromises[index] = setManagedOption(elementId, optionGroup, currentElem).catch((error) => {
            /* only log warning as that is expected when no manifest file is found */
            Logger.logWarning("could not get managed options", error);

            // now set "real"/"usual" option
            return setOption(elementId, optionGroup, currentElem);
        });
    });

    // when everything is finished, apply live elements for values if needed
    const allOptionsLoaded = Promise.all(allPromises);

    return allOptionsLoaded.then(() => {
        applyOptionLive();
    });
}

/**
 * Resets all options.
 *
 * @function
 * @private
 * @param {Event} event
 * @returns {void}
 */
async function resetOptions(event) {
    Logger.logInfo("reset options");

    // disable reset button (which triggered this) until process is running
    event.target.setAttribute("disabled", "");

    // temporarily save old options
    await browser.storage.sync.get().then((options) => {
        lastOptionsBeforeReset = options;
    });

    // cleanup resetted cached option after message is hidden
    MessageHandler.setHook(MESSAGE_LEVEL.SUCCESS, null, () => {
        lastOptionsBeforeReset = null;
        Logger.logInfo("reset options message hidden, undo vars cleaned");
    });

    // finally reset options
    browser.storage.sync.clear().then(() => {
        return loadOptions().then(() => {
            MessageHandler.showSuccess("resettingOptionsWorked", true, {
                text: "messageUndoButton",
                action: () => {
                    browser.storage.sync.set(lastOptionsBeforeReset).then(() => {
                        // re-load the options again
                        loadOptions();
                    }).catch((error) => {
                        Logger.logError("Could not undo option resetting: ", error);
                        MessageHandler.showError("couldNotUndoAction");
                    }).finally(() => {
                        MessageHandler.hideSuccess();
                    });
                }
            });
        });
    }).catch((error) => {
        Logger.logError(error);
        MessageHandler.showError("resettingOptionsFailed", true);
    }).finally(() => {
        // re-enable button
        event.target.removeAttribute("disabled");
    });
}

/**
 * Initializes the options.
 *
 * @function
 * @returns {void}
 */
export function init() {
    loadOptions().catch((error) => {
        Logger.logError(error);
        MessageHandler.showError("couldNotLoadOptions", false);
    });

    // add event listeners for all options
    document.querySelectorAll(".save-on-input").forEach((currentElem) => {
        currentElem.addEventListener("input", saveOption);
    });
    document.querySelectorAll(".save-on-change").forEach((currentElem) => {
        currentElem.addEventListener("change", saveOption);
    });

    document.querySelectorAll(".trigger-on-update").forEach((currentElem) => {
        currentElem.addEventListener("input", customOptionTrigger);
    });
    document.querySelectorAll(".trigger-on-change").forEach((currentElem) => {
        currentElem.addEventListener("change", customOptionTrigger);
    });

    document.getElementById("resetButton").addEventListener("click", resetOptions);
}

Logger.logInfo("OptionHandler module loaded.");
