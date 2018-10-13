/**
 * Load, save and apply options to HTML options page.
 *
 * @module internal/Trigger
 */

// common modules
import * as Logger from "/common/modules/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";

import * as HtmlMod from "./HtmlModification.js";

/**
 * Denotes to run all the currently registered save trigger.
 *
 * @public
 * @var {Symbol} RUN_ALL_SAFE_TRIGGER
 */
const RUN_ALL_SAVE_TRIGGER = Symbol("runAllSafeTrigger");

const triggers = {
    onSave: [],
    onChange: [],
    onUpdate: [],
    onBeforeLoad: [],
    onAfterLoad: []
};

/**
 * Trigger to run when an option is saved.
 *
 * @async
 * @callback saveTrigger
 * @param {any} optionValue the value of the changed option
 * @param {string} option the name of the option that has been changed
 * @return {Promise} optionally, to use await events
 */

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
 * @returns {Promise}
 * @see {@link saveTrigger}
 */
export async function runSaveTrigger(option, optionValue) {
    if (option === undefined) {
        Logger.logInfo("run all save triggers");

        const promises = [];
        for (const trigger of triggers.onSave) {
            const option = trigger.option;
            const optionValue = await AddonSettings.get(option);

            promises.push(trigger.triggerFunc(optionValue, option));
        }
        return Promise.all(promises);
    }

    // get option value, if needed
    if (optionValue === undefined) {
        optionValue = await AddonSettings.get(option);
    }

    Logger.logInfo("runSaveTrigger:", option, optionValue);

    // run all registered triggers for that option
    const promises = [];
    for (const trigger of triggers.onSave.filter((trigger) => trigger.option === option)) {
        promises.push(trigger.triggerFunc(optionValue, option));
    }
    return Promise.all(promises);
}

/**
 * Trigger to run when "trigger-on-update" is set.
 *
 * This triggers when the value has been changed in any way.
 * Internally this binds to the "input" event.
 *
 * @async
 * @callback onUpdateTrigger
 * @param {any} optionValue the value of the changed option
 * @param {string} option the name of the option that has been changed
 * @param {Event} event the original event
 * @return {Promise} optionally, to use await events
 */

/**
 * Trigger to run when "trigger-on-change" is set.
 *
 * @async
 * @callback onChangeTrigger
 * @param {any} optionValue the value of the changed option
 * @param {string} option the name of the option that has been changed
 * @param {Event} event the original event
 * @return {Promise} optionally, to use await events
 */

/**
 * Triggered by "trigger-on-…" classes.
 *
 * Can be used to do do some stuff per option, but do not save the option in
 * contrast to when {@link applyOptionLive()} is usually called.
 * It either runs {@link onUpdateTrigger} or {@link onChangeTrigger}.
 *
 * @protected
 * @function
 * @param  {Event} event
 * @returns {void}
 * @throws {Error}
 */
export function runHtmlEventTrigger(event) {
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
    const promises = [];
    for (const trigger of triggers[triggerType].filter((trigger) => trigger.option === option)) {
        promises.push(trigger.triggerFunc(optionValue, option, event));
    }
    return Promise.all(promises);
}

/**
 * Trigger that runs before new options are loaded.
 *
 * This trigger is executed before the options are loaded. You can e.g. use it to
 * reset some display styles that may have been changed by one of your other
 * callbacks, as this is e.g. also called when the user manually resets the options.
 * (i.e. they are reloaded then).
 *
 * @callback beforeLoadTrigger
 */


/**
 * Trigger that runs after new options have been loaded.
 *
 * This trigger is executed after the options have been loaded.
 *
 * @callback afterLoadTrigger
 */

/**
 * Exeutes the trigger that runs before the settings options are (re)loaded.
 *
 * @protected
 * @function
 * @returns {Promise}
 * @see {@link beforeLoadTrigger}
 */
export function runBeforeLoadTrigger() {
    Logger.logInfo("runBeforeLoadTrigger");

    // run all registered triggers for that option
    const promises = [];
    for (const trigger of triggers.onBeforeLoad) {
        promises.push(trigger.triggerFunc());
    }
    return Promise.all(promises);
}

/**
 * Exeutes the trigger that runs after the settings options have been (re)loaded.
 *
 * @protected
 * @function
 * @returns {Promise}
 * @see {@link afterLoadTrigger}
 */
export function runAfterLoadTrigger() {
    Logger.logInfo("runAfterLoadTrigger");

    // run all registered triggers for that option
    const promises = [];
    for (const trigger of triggers.onAfterLoad) {
        promises.push(trigger.triggerFunc());
    }
    return Promise.all(promises);
}

/**
 * Registers a trigger of any type.
 *
 * @private
 * @function
 * @param  {string} triggerType
 * @param  {string} optionTrigger
 * @param  {function} callback
 * @returns {void}
 */
function registerTrigger(triggerType, optionTrigger, callback) {
    triggers[triggerType].push({
        option: optionTrigger,
        triggerFunc: callback
    });
}

/**
 * Registers a save trigger.
 * The trigger get the values (optionValue, option) passed as parameters.
 * See {@link saveTrigger} for details.
 *
 * @public
 * @function
 * @param  {string} optionTrigger
 * @param  {saveTrigger} callback
 * @returns {void}
 */
function registerSave(optionTrigger, callback) {
    registerTrigger("onSave", optionTrigger, callback);
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
 * @param  {onUpdateTrigger} callback
 * @returns {void}
 */
function registerUpdate(optionTrigger, callback) {
    registerTrigger("onUpdate", optionTrigger, callback);
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
 * @param  {onChangeTrigger} callback
 * @returns {void}
 */
function registerChange(optionTrigger, callback) {
    registerTrigger("onChange", optionTrigger, callback);
}

/**
 * Registers an beforeLoad trigger.
 *
 * This trigger is executed before the options are loaded. You can e.g. use it to
 * reset some display styles that may have been changed by one of your other
 * callbacks, as this is e.g. also called when the user manually resets the options.
 * (i.e. they are reloaded then).
 *
 * @public
 * @function
 * @param  {beforeLoadTrigger} callback
 * @returns {void}
 */
function registerBeforeLoad(callback) {
    triggers.onBeforeLoad.push({
        triggerFunc: callback
    });
}

/**
 * Registers an afterLoad trigger.
 *
 * This trigger is executed after the options have been loaded.
 * You can pass the special option {@link RUN_ALL_SAFE_TRIGGER} to this to register
 * a trigger for all the triggers registered via {@link registerSave}.
 * This is a common scenario when you modify your GUI in the save triggers and want
 * it to be up-to-date/displayed correctly when the options page is first opened/the
 * options are loaded.
 *
 * @public
 * @function
 * @param  {afterLoadTrigger|RUN_ALL_SAFE_TRIGGER} callback
 * @returns {void}
 */
function registerAfterLoad(callback) {
    if (callback === RUN_ALL_SAVE_TRIGGER) {
        callback = runSaveTrigger;
    }

    triggers.onAfterLoad.push({
        triggerFunc: callback
    });
}

/**
 * Reset all registered triggers/callbacks.
 *
 * @public
 * @function
 * @returns {void}
 */
function unregisterAll() {
    triggers.onSave = [];
    triggers.onChange = [];
    triggers.onUpdate = [];
    triggers.onBeforeLoad = [];
    triggers.onAfterLoad = [];
}

// export @public functions to be used as a public API as defaults
export default {RUN_ALL_SAVE_TRIGGER, registerTrigger, registerSave, registerUpdate, registerChange, registerBeforeLoad, registerAfterLoad, unregisterAll};
