/**
 * Provides access to the most common message types.
 *
 * @module /common/modules/MessageHandler/MessageHandler
 * @requires /common/modules/lib/lodash/isFunction
 * @requires /common/modules/data/MessageLevel
 */

import {MESSAGE_LEVEL} from "/common/modules/data/MessageLevel.js";

import * as Logger from "/common/modules/Logger.js";

import * as CustomMessages from "./CustomMessages.js";

// simply forward custom message types
export {hideMessage, showMessage} from "./CustomMessages.js";

/**
 * Hides the error message.
 *
 * @function
 * @returns {void}
 */
export function hideError() {
    CustomMessages.hideMessage(MESSAGE_LEVEL.ERROR);
}

/**
 * Hide warning message.
 *
 * @function
 * @returns {void}
 */
export function hideWarning() {
    CustomMessages.hideMessage(MESSAGE_LEVEL.WARN);
}

/**
 * Hide info message.
 *
 * @function
 * @returns {void}
 */
export function hideInfo() {
    CustomMessages.hideMessage(MESSAGE_LEVEL.INFO);
}

/**
 * Hide loading message.
 *
 * @function
 * @returns {void}
 */
export function hideLoading() {
    CustomMessages.hideMessage(MESSAGE_LEVEL.LOADING);
}

/**
 * Hide success message.
 *
 * @function
 * @returns {void}
 */
export function hideSuccess() {
    CustomMessages.hideMessage(MESSAGE_LEVEL.SUCCESS);
}

/**
 * Show a critical error.
 *
 * Note this should only be used to show *short* error messages, which are
 * meaningfull to the user, as the space is limited. So it is mostly only
 * useful to use only one param: a string.
 * Also pay attention to the fact, that it currently can only show one error
 * once.
 *
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showError(...args) {
    args.unshift(MESSAGE_LEVEL.ERROR);
    CustomMessages.showMessage(...args);
}

/**
 * Show an warning message.
 *
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showWarning(...args) {
    args.unshift(MESSAGE_LEVEL.WARN);
    CustomMessages.showMessage(...args);
}

/**
 * Show an info message.
 *
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string} actionButton.link URL to site to open on link
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showInfo(...args) {
    args.unshift(MESSAGE_LEVEL.INFO);
    CustomMessages.showMessage(...args);
}

/**
 * Shows a loading message.
 *
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showLoading(...args) {
    args.unshift(MESSAGE_LEVEL.LOADING);
    CustomMessages.showMessage(...args);
}

/**
 * Show a success message.
 *
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showSuccess(...args) {
    args.unshift(MESSAGE_LEVEL.SUCCESS);
    CustomMessages.showMessage(...args);
}

/**
 * Let's other functions set a hook to be called when a message type is
 * shown or hidden.
 *
 * Set parameters to null or undefined (i.e. do not set) in order to disable
 * the hook.
 * The errorShown function gets one parameter: The arguments passed to the
 * function, as an array.
 *
 * @function
 * @param  {MESSAGE_LEVEL|HtmlElement} messageType use string "global" for a global hook
 * @param {function|null} [hookShown]
 * @param {function|null} [hookHidden]
 * @returns {void}
 */
export function setHook(messageType, hookShown = null, hookHidden = null) {
    CustomMessages.setHook(messageType, "show", hookShown);
    CustomMessages.setHook(messageType, "hide", hookHidden);
}

/**
 * Called when a message is dismissed.
 *
 + When called, the function does not know, which message is hidden, but you
 * can determinante it by yourself.
 * The called hook gets an object with two parameters:
 * - {HTMLElement} elMessage – the message element, which was hidden
 * - {event} event – the original click even on the dismiss button
 *
 * @function
 * @param {function|null} [startHook]
 * @param {function|null} [endHook]
 * @returns {void}
 */
export function setDismissHooks(startHook = null, endHook = null) {
    CustomMessages.setGlobalHook("dismissStart", startHook);
    CustomMessages.setGlobalHook("dismissEnd", endHook);
}

/**
 * Only registers the message type, if the HTML element exists.
 *
 * @private
 * @param  {int|string} messageType
 * @param  {HTMLElement} elMessage element to register with it
 * @param  {string} [designClass] the class to apply
 * @returns {void}
 */
function registerMessageTypeIfExists(messageType, elMessage, designClass) {
    if (!elMessage) {
        Logger.logWarning(elMessage, "does not exist. Skip registering message type.");
        return;
    }

    CustomMessages.registerMessageType(messageType, elMessage, designClass);
}

/**
 * Initialises the module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    registerMessageTypeIfExists(MESSAGE_LEVEL.ERROR, document.getElementById("messageError"), "error");
    registerMessageTypeIfExists(MESSAGE_LEVEL.WARN, document.getElementById("messageWarning"), "warning");
    registerMessageTypeIfExists(MESSAGE_LEVEL.INFO, document.getElementById("messageInfo"), "info");
    registerMessageTypeIfExists(MESSAGE_LEVEL.SUCCESS, document.getElementById("messageSuccess"), "success");
    registerMessageTypeIfExists(MESSAGE_LEVEL.LOADING, document.getElementById("messageLoading"), "info");
}

// init module automatically
init();
