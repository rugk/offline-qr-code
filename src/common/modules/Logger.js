import {MESSAGE_LEVEL} from "/common/modules/internal/MessageLevel.js";
import {ADDON_NAME_SHORT} from "/common/modules/GlobalConsts.js";

import * as AddonSettings from "/common/modules/AddonSettings.js";

// redirect module
export {MESSAGE_LEVEL} from "/common/modules/internal/MessageLevel.js";

let debugMode = null;

const MESSAGE_LEVEL_NAME = Object.freeze({
    [MESSAGE_LEVEL.ERROR]: "ERROR",
    [MESSAGE_LEVEL.WARN]: "WARN",
    [MESSAGE_LEVEL.INFO]: "INFO",
    [MESSAGE_LEVEL.LOADING]: "LOADING",
    [MESSAGE_LEVEL.SUCCESS]: "SUCCESS"
});

/**
 * Logs a string to console.
 *
 * Pass as many strings/output as you want.
 * For brevity, better prefer the other functions (logError, etc.) instead
 * of this one.
 *
 * @name   Logger.log
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
 * @name   Logger.logError
 * @function
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
 * @name   Logger.logWarning
 * @function
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
 * @name   Logger.logInfo
 * @function
 * @param  {...*} args
 * @returns {void}
 */
export function logInfo(...args) {
    // skip log only, when deliberately disabled!
    // NOTE: The effect of this is, taht when the settings are not yet
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
 * @name   Logger.setDebugMode
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
 * @name   Logger.init
 * @function
 * @returns {void}
 */
export function init() {
    AddonSettings.get("debugMode").then((isDebug) => {
        setDebugMode(isDebug);
    });
}

// init module automatically
init();
