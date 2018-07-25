import {MESSAGE_LEVEL} from "/common/modules/MessageLevel.js";
import {ADDON_NAME_SHORT} from "/common/modules/GlobalConsts.js";

import * as AddonSettings from "/common/modules/AddonSettings.js";

let debugMode = null;

const MESSAGE_LEVEL_NAME = Object.freeze({
    [MESSAGE_LEVEL.ERROR]: "ERROR",
    [MESSAGE_LEVEL.WARN]: "WARN",
    [MESSAGE_LEVEL.INFO]: "INFO",
    [MESSAGE_LEVEL.LOADING]: "LOADING",
    [MESSAGE_LEVEL.SUCCESS]: "SUCCESS"
});

/**
 * Checks if value is a object.
 *
 * @function
 * @param  {*} value
 * @returns {boolean}
 */
function isObject(value){
    const type = typeof value;
    return value != null && (type === "object" || type === "function");
}

/**
 * Copy nested objects to ensure a properly output.
 *
 * @function
 * @param  {...*} args
 * @returns {Object}
 */
function verifyArgs(args) {
    for(const key in args) {
        if (args.hasOwnProperty(key)) {
            if(isObject(args[key])) {
                args[key] = JSON.parse(JSON.stringify(args[key]));
            }
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
 * @function
 * @param  {MESSAGE_LEVEL} messagetype
 * @param  {...*} args
 * @returns {void}
 */
export function log(...args) {
    if (arguments.length < 0) {
        // recursive call, it's secure, because this won't fail
        log(MESSAGE_LEVEL.ERROR, "log has been called without parameters");
        return;
    }

    const messagetype = args[0];
    args[0] = `${ADDON_NAME_SHORT} [${MESSAGE_LEVEL_NAME[messagetype]}]`;

    args = verifyArgs(args);

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
 * @function
 * @param  {...*} args
 * @returns {void}
 */
export function logError(...args) {
    args.unshift(MESSAGE_LEVEL.ERROR);

    args = verifyArgs(args);

    log(...args);
}

/**
 * Logs a warning.
 *
 * @function
 * @param  {...*} args
 * @returns {void}
 */
export function logWarning(...args) {
    args.unshift(MESSAGE_LEVEL.WARN);

    args = verifyArgs(args);

    log(...args);
}

/**
 * Logs some information.
 *
 * Note: This log may be skipped, when not in debug mode.
 *
 * @function
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

    args = verifyArgs(args);

    log(...args);
}

/**
 * Enable or disable the debug mode.
 *
 * @function
 * @param  {boolean} isDebug
 * @returns {void}
 */
export function setDebugMode(isDebug) {
    debugMode = isDebug;
}

/**
 * Inits some information.
 *
 * @function
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
