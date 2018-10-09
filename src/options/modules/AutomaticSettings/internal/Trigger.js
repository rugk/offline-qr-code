/**
 * Load, save and apply options to HTML options page.
 *
 * @module modules/Trigger
 */

// common modules
import * as Logger from "/common/modules/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";

import * as HtmlMod from "./HtmlModification.js";

// export @public functions to be used as a public API as defaults
export default {registerTrigger, registerSave, registerUpdate, registerChange};

const triggers = {
    onSave: [],
    onChange: [],
    onUpdate: []
};

/**
 * Executes special handling for applying certain settings.
 *
 * E.g. when a setting is saved, it executes to apply some options live, so the
 * user immediately sees the change or the change is immediately applied.
 * If no parameters are passed, this gets and applies all options.
 *
 * @protected
 * @function
 * @param  {string} [option]
 * @param  {Object} [optionValue] will be automatically retrieved, if not given
 * @returns {Promise} Promise only if called without parameters
 */
export async function runSaveTrigger(option, optionValue) {
    if (option === undefined) {
        Logger.logInfo("applying all options live");

        triggers.onSave.forEach((trigger) => {
            runSaveTrigger(trigger.option);
        });
    }

    // get option value, if needed
    if (optionValue === undefined) {
        optionValue = await AddonSettings.get(option);
    }

    Logger.logInfo("runSaveTrigger:", option, optionValue);

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
 * @protected
 * @function
 * @param  {Event} event
 * @returns {void}
 * @throws {Error}
 */
export function runCustomTrigger(event) {
    const elOption = event.target;

    const [option, optionValue] = HtmlMod.getIdAndOptionsFromElement(elOption);

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
 * @private
 * @function
 * @param  {string} triggerType
 * @param  {string} optionTrigger
 * @param  {function} functionToTrigger
 * @returns {void}
 */
function registerTrigger(triggerType, optionTrigger, functionToTrigger) {
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
function registerSave(optionTrigger, functionToTrigger) {
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
function registerUpdate(optionTrigger, functionToTrigger) {
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
function registerChange(optionTrigger, functionToTrigger) {
    registerTrigger("onChange", optionTrigger, functionToTrigger);
}
