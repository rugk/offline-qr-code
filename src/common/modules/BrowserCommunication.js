/**
 * Communicates between different browser parts.
 *
 * @module modules/BrowserCommunication
 * @requires /common/modules/Logger
 * @requires ../data/BrowserCommunicationTypes
 */
import * as Logger from "/common/modules/Logger.js";
import { COMMUNICATION_MESSAGE_TYPE } from "./data/BrowserCommunicationTypes.js";

const callbacks = {};

/**
 * The callback that can be used to send a response.
 *
 * It is just the default browser callback that is used and documented here.
 * However, it is strongly discouraged to return "true", as this is hard to
 * handle with multiple registered callbacks.
 *
 * @callback sendResponseCallback
 * @param {string} message the response message, "may be any JSON-ifiable object"
 * @return {Promise}
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage#Parameters}
 */

/**
 * This is the listener that is called when a message with that type has arrived.
 *
 * It is just the default browser callback that is used and documented here.
 * However, it is strongly discouraged to return "true", as this is hard to
 * handle with multiple registered callbacks.
 *
 * @callback listenerCallback
 * @param {Object} request JSON-ifiable object of the message
 * @param {Object} sender the runtime.MessageSender, see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender}
 * @param {sendResponseCallback} sendResponse
 * @returns {Promise}
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage#Parameters}
 */

/**
 * Throws an error, if the message type is not known/known.
 *
 * @private
 * @param {COMMUNICATION_MESSAGE_TYPE} messageType type of message
 * @returns {void}
 * @throws {Error}
 */
function checkMessageTypeVadility(messageType) {
    if (messageType === undefined) {
        throw new Error("message type is undefined");
    }

    if (Object.values(COMMUNICATION_MESSAGE_TYPE).includes(messageType)) {
        return; // all right
    }

    throw new Error(`message type ${messageType} is not valid/known`);
}

/**
 * Handles messages received by other parts.
 *
 * @function
 * @private
 * @param {Object} request JSON-ifiable object of the message
 * @param {Object} sender the runtime.MessageSender, see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender}
 * @param {sendResponseCallback} sendResponse
 * @returns {Promise|true}
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage#Parameters}
 */
function handleMessages(request, sender, sendResponse) {
    Logger.logInfo("Got message", request, "from", sender);

    const messageType = request.type;
    checkMessageTypeVadility(messageType);

    if (!(messageType in callbacks) || callbacks[messageType].length === 0) {
        Logger.logWarning(`No callbacks for message type "${messageType}" registered.`);
        return Promise.resolve();
    }

    // call all callbacks and keep return values
    const promises = [];
    let gotTrueAsReturn = false;
    for (const callback of callbacks[messageType]) {
        const returnValue = callback(request, sender, sendResponse);

        // notice if
        if (returnValue === true) {
            gotTrueAsReturn = true;
            continue;
        }

        promises.push(callback(request, sender, sendResponse));
    }

    // handle returning
    if (gotTrueAsReturn) {
        if (callbacks[messageType].length !== 1) {
            // if it was not the only callback, then show a real error
            Logger.logError(`At least one callback for message type "${messageType}" returned the legacy value "true".
            As you have registered ${callbacks[messageType].length} listeners this may lead to errors.`);
        } else {
            // show warning as this behaviour is discouraged
            Logger.logWarning(`At least one callback for message type "${messageType}" returned the legacy value "true". Please return a Promise instead.`);
        }

        return true;
    }

    return Promise.all(promises);
}

/**
 * Add a listener for a specific type.
 *
 * You can add multiple listeners, but may *NOT* preserve the order.
 * Actually it does call them in reverse as it uses a stack (LIFO) internally.
 *
 * @public
 * @param {COMMUNICATION_MESSAGE_TYPE} messageType type of message to receive
 * @param {listenerCallback} callback
 * @returns {void}
 */
export function addListener(messageType, callback) {
    checkMessageTypeVadility(messageType);

    if (!(messageType in callbacks)) {
        callbacks[messageType] = [];
    }
    callbacks[messageType].push(callback);
}

/**
 * Init context menu module.
 *
 * Adds menu elements.
 *
 * @public
 * @returns {void}
 */
export function init() {
    browser.runtime.onMessage.addListener(handleMessages);
}

// automatically init's itself
init();
