CommonMessages /**
 * Load, save and apply options to HTML options page.
 *
 * @module internal/LoadAndSave
 * @requires /common/modules/Logger
 * @requires /common/modules/data/MessageLevel
 * @requires /common/modules/MessageHandler
 * @requires ./Trigger
 * @requires ./HtmlModification
 */

// common modules
import * as Logger from "/common/modules/Logger.js";
import { MESSAGE_LEVEL } from "/common/modules/data/MessageLevel.js";
import * as CommonMessages from "/common/modules/MessageHandler/CommonMessages.js";

// import internal modules
import * as Trigger from "./Trigger.js";
import * as HtmlMod from "./HtmlModification.js";
import * as OptionsModel from "./OptionsModel.js";

// vars
let managedInfoIsShown = false;

let lastOptionsBeforeReset;

/**
 * Saves the specific settings that triggered this.
 *
 * @private
 * @function
 * @param  {Object} event
 * @returns {void}
 */
async function saveOption(event) {
    /** @var {HTMLElement} */
    let elOption = event.target;

    // radio options need special handling, use (closest) parent
    if (elOption.getAttribute("type") === "radio") {
        elOption = elOption.closest("[data-type=radiogroup]");
        elOption.selectedElement = event.target;
    }

    // do not save if managed
    if (elOption.hasAttribute("disabled")) {
        Logger.logInfo(elOption, "is disabled, ignore sync setting");
        return;
    }

    const [option, optionValue] = HtmlMod.getIdAndOptionsFromElement(elOption);

    Logger.logInfo("save option", elOption, option, optionValue);

    await Trigger.runSaveTrigger(option, optionValue);

    browser.storage.sync.set({
        [option]: optionValue
    }).catch((error) => {
        Logger.logError("could not save option", option, ": ", error);
        CommonMessages.showError("couldNotSaveOption", true);
    });
}

/**
 * Show info that some settings are managed.
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

    CommonMessages.showInfo("someSettingsAreManaged", false);
    managedInfoIsShown = true;
}

/**
 * Get the name of the option from an element..
 *
 * @private
 * @function
 * @param {string} option
 * @returns {HTMLElement}
 */
function getElementFromOptionId(option) {
    return document.querySelector(`[name=${option}]`);
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
function setManagedOption(option, optionGroup, elOption = getElementFromOptionId(option)) {
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
 * function provided with {@link ./HtmlModification#setDefaultOptionProvider}.
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
function setSyncedOption(option, optionGroup, elOption = getElementFromOptionId(option)) {
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

        HtmlMod.applyOptionToElement(option, optionGroup, elOption, res);
    });
}

/**
 * Load option and set it to the given element.
 *
 * Optionally, you can already give it the option name.
 *
 * @public
 * @function
 * @param  {HTMLElement} elOption element of the option
 * @param  {string} [option] name of the option
 * @returns {Promise}
 */
export function loadOption(elOption, option) {
    option = option ? option : HtmlMod.getOptionIdFromElement(elOption);

    let optionGroup = null;
    if ("optiongroup" in elOption.dataset) {
        optionGroup = elOption.dataset.optiongroup;
    }

    // try to get option ID from input element if needed
    if (!option && elOption.dataset.type === "radiogroup") {
        option = elOption.querySelector("input[type=radio]").getAttribute("name");
    }

    return setManagedOption(option, optionGroup, elOption).catch((error) => {
        /* only log warning as that is expected when no manifest file is found */
        Logger.logWarning("could not get managed options", error);

        // now set "real"/"usual" option
        return setSyncedOption(option, optionGroup, elOption);
    });
}
/**
 * Load option and set to element if you give it an option name.
 *
 * @public
 * @function
 * @param  {string} option name of the option
 * @param  {HTMLElement} [elOption] optional element of the option, will
 *                                be autodetected otherwise
 * @returns {Promise}
 */
export function loadOptionByName(option, elOption = getElementFromOptionId(option)) {
    return loadOption(elOption, option);
}

/**
 * Loads all options of the page.
 *
 * @private
 * @function
 * @returns {Promise}
 */
async function loadAllOptions() {
    // reset remembered options to prevent arkward errors when reloading the options
    HtmlMod.resetRememberedOptions();
    const allPromises = [];

    await Trigger.runBeforeLoadTrigger();

    // set each option
    document.querySelectorAll(".setting").forEach((currentElem, index) => {
        allPromises[index] = loadOption(currentElem);
    });

    // when everything is finished, apply live elements for values if needed
    const allOptionsLoaded = Promise.all(allPromises);

    return allOptionsLoaded.then(() => {
        // to apply options live
        return Trigger.runAfterLoadTrigger();
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

    // disable reset button (which triggered this) until process is finished
    event.target.setAttribute("disabled", "");

    // temporarily save old options
    await browser.storage.sync.get().then((options) => {
        lastOptionsBeforeReset = options;
    });

    // cleanup resetted cached option after message is hidden
    CommonMessages.setHook(MESSAGE_LEVEL.SUCCESS, null, () => {
        lastOptionsBeforeReset = null;
        Logger.logInfo("reset options message hidden, undo vars cleaned");
    });

    // finally reset options
    browser.storage.sync.clear().then(() => loadAllOptions().then(
        () => CommonMessages.showSuccess("resettingOptionsWorked", true, {
            text: "messageUndoButton",
            action: () => {
                browser.storage.sync.set(lastOptionsBeforeReset).then(() => {
                    // re-load the options again
                    return loadAllOptions();
                }).catch((error) => {
                    Logger.logError("Could not undo option resetting: ", error);
                    CommonMessages.showError("couldNotUndoAction");
                }).finally(() => {
                    CommonMessages.hideSuccess();
                });
            }
        })
    )).catch((error) => {
        Logger.logError(error);
        CommonMessages.showError("resettingOptionsFailed", true);
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
 * @returns {Promise}
 */
export function init() {
    // check requirements
    OptionsModel.verifyItIsReady();

    const loadPromise = loadAllOptions().catch((error) => {
        Logger.logError(error);
        CommonMessages.showError("couldNotLoadOptions", false);

        // re-throw error
        throw error;
    });

    // add event listeners for all options
    document.querySelectorAll(".save-on-input").forEach((currentElem) => {
        currentElem.addEventListener("input", saveOption);
    });
    document.querySelectorAll(".save-on-change").forEach((currentElem) => {
        currentElem.addEventListener("change", saveOption);
    });

    document.querySelectorAll(".trigger-on-update").forEach((currentElem) => {
        currentElem.addEventListener("input", Trigger.runHtmlEventTrigger);
    });
    document.querySelectorAll(".trigger-on-change").forEach((currentElem) => {
        currentElem.addEventListener("change", Trigger.runHtmlEventTrigger);
    });

    const resetButton = document.getElementById("resetButton");
    if (resetButton) {
        resetButton.addEventListener("click", resetOptions);
    }

    return loadPromise;
}
