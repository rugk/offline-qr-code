/**
 * Load, save and apply options to HTML options page.
 *
 * @module modules/OptionHandler
 */

// common modules
import { MESSAGE_LEVEL } from "/common/modules/data/MessageLevel.js";
import * as Logger from "/common/modules/Logger.js";
import * as MessageHandler from "/common/modules/MessageHandler.js";

// import internal modules
import * as Trigger from "./Trigger.js";
import * as HtmlMod from "./HtmlModification.js";

// vars
let managedInfoIsShown = false;

let lastOptionsBeforeReset;

/**
 * Saves all settings.
 *
 * @private
 * @function
 * @param  {Object} event
 * @returns {void}
 */
function saveOption(event) {
    /** @var {HTMLElement} */
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

    const [option, optionValue] = HtmlMod.getIdAndOptionsFromElement(elOption);

    Logger.logInfo("save option", elOption, option, optionValue);

    Trigger.runSaveTrigger(option, optionValue);

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
 * @private
 * @function
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
 * @private
 * @function
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

        HtmlMod.applyOptionToElement(option, optionGroup, elOption, res);
        // and disable control
        elOption.setAttribute("disabled", "");
        elOption.setAttribute("title", browser.i18n.getMessage("optionIsDisabledBecauseManaged"));
        // could also set readonly elOption.setAttribute("readonly", "") //TODO: test
    });
}

/**
 * Display option in option page.
 *
 * If the option is not saved already, it uses the default provided by the
 * {@link AddonSettings} module.
 *
 * @private
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
function setSyncedOption(option, optionGroup, elOption, ignoreDisabled) {
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

        HtmlMod.applyOptionToElement(option, optionGroup, elOption, res);
    });
}

/**
 * Loads all options of the page.
 *
 * @private
 * @function
 * @returns {Promise}
 */
function loadAllOptions() {
    // reset remembered options to prevent arkward errors when reloading the options
    HtmlMod.resetRememberedOptions();
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
            return setSyncedOption(elementId, optionGroup, currentElem);
        });
    });

    // when everything is finished, apply live elements for values if needed
    const allOptionsLoaded = Promise.all(allPromises);

    return allOptionsLoaded.then(() => {
        Trigger.runSaveTrigger();
    });
}

/**
 * Resets all options.
 *
 * @private
 * @function
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
        return loadAllOptions().then(() => {
            MessageHandler.showSuccess("resettingOptionsWorked", true, {
                text: "messageUndoButton",
                action: () => {
                    browser.storage.sync.set(lastOptionsBeforeReset).then(() => {
                        // re-load the options again
                        loadAllOptions();
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
 * Initializes the options, loads them and sets everything up.
 *
 * @public
 * @function
 * @returns {void}
 */
export function init() {
    loadAllOptions().catch((error) => {
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
        currentElem.addEventListener("input", Trigger.runCustomTrigger);
    });
    document.querySelectorAll(".trigger-on-change").forEach((currentElem) => {
        currentElem.addEventListener("change", Trigger.runCustomTrigger);
    });

    document.getElementById("resetButton").addEventListener("click", resetOptions);
}
