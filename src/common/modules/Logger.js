/**
 * Wrapper around console functions for logging messages, erros etc.
 *
 * @module /common/modules/Logger
 * @requires /common/modules/data/MessageLevel
 * @requires /common/modules/data/GlobalConsts
 * @requires /common/modules/AddonSettings
 */
import {MESSAGE_LEVEL} from "/common/modules/data/MessageLevel.js";
import {ADDON_NAME_SHORT} from "/common/modules/data/GlobalConsts.js";

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

import isPlainObject from "/common/modules/lib/lodash/isPlainObject.js";

let debugMode = null;

const MESSAGE_LEVEL_NAME = Object.freeze({
    [MESSAGE_LEVEL.ERROR]: "ERROR",
    [MESSAGE_LEVEL.WARN]: "WARN",
    [MESSAGE_LEVEL.INFO]: "INFO",
    [MESSAGE_LEVEL.LOADING]: "LOADING",
    [MESSAGE_LEVEL.SUCCESS]: "SUCCESS"
});

/**
 * Freeze (nested) objects to ensure a proper output.
 *
 * @private
 * @param  {array} args
 * @returns {Object}
 */
function prepareObjectsForLogging(args) {
    for (const [index, value] of args.entries()) {
        if (isPlainObject(value)) {
            args[index] = JSON.parse(JSON.stringify(value));
        }
    }
    return args;
}

/**
 * Logs a string to console.
 *
 * Pass as many strings/output as you want.
 * For brevity, better prefer the other functions (logError, etc.) instead
 * of this one.
 *
 * @public
 * @param  {MESSAGE_LEVEL} messagetype
 * @param  {...*} args
 * @returns {void}
 */
export function log(...args) {
    if (arguments.length <= 0) {
        // recursive call, it's secure, because this won't fail
        log(MESSAGE_LEVEL.ERROR, "log has been called without parameters");
        return;
    }

    const messagetype = args[0];
    args[0] = `${ADDON_NAME_SHORT} [${MESSAGE_LEVEL_NAME[messagetype]}]`;

    args = prepareObjectsForLogging(args);

    /* eslint-disable no-console */
    switch (messagetype) {
    case MESSAGE_LEVEL.ERROR:
        console.error(...args);
        break;
    case MESSAGE_LEVEL.WARN:
        console.warn(...args);
        break;
    default:
        console.log(...args);
    }
    /* eslint-enable no-console */
}

/**
 * Logs a fatal error.
 *
 * @public
 * @param  {...*} args
 * @returns {void}
 */
export function logError(...args) {
    args.unshift(MESSAGE_LEVEL.ERROR);

    log(...args);
}

/**
 * Logs a warning.
 *
 * @public
 * @param  {...*} args
 * @returns {void}
 */
export function logWarning(...args) {
    args.unshift(MESSAGE_LEVEL.WARN);

    log(...args);
}

/**
 * Logs some information.
 *
 * Note: This log may be skipped, when not in debug mode.
 *
 * @public
 * @param  {...*} args
 * @returns {void}
 */
export function logInfo(...args) {
    // skip log only, when deliberately disabled!
    // NOTE: The effect of this is, that when the settings are not yet
    // loaded, we always log all messages. However, we also cannot wait/delay
    // loading these in some asyncronous way as log messages are time-critical
    // and must be in the correct order to be useful output.
    if (debugMode === false) {
        return;
    }

    args.unshift(MESSAGE_LEVEL.INFO);

    log(...args);
}

/**
 * Enable or disable the debug mode.
 *
 * @public
 * @param  {boolean} isDebug
 * @returns {void}
 */
export function setDebugMode(isDebug) {
    debugMode = isDebug;
}

/**
 * Inits some information.
 *
 * @public
 * @returns {Promise}
 */
export function init() {
    return AddonSettings.get("debugMode").then((isDebug) => {
        setDebugMode(isDebug);
    });
}

// init module automatically
init().then(() => {
    logInfo("Logger module loaded.");
});
