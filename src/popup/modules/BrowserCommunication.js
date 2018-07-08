import * as Logger from "/common/modules/Logger.js";

import * as QrCreator from "./QrCreator.js";
import {initCompleted} from "./InitQrCode.js";

const COMMUNICATION_MESSAGE_TYPE = Object.freeze({
    SET_QR_TEXT: "setQrText",
});

let overwroteQrCode = false;

/**
 * Handles messages received by other parts.
 *
 * @name   BrowserCommunication.handleMessages
 * @function
 * @private
 * @param {Object} request
 * @param {Object} sender
 * @param {function} sendResponse
 * @returns {void}
 */
function handleMessages(request, sender, sendResponse) {
    Logger.logInfo("Got message", request, "from", sender);

    switch (request.type) {
    case COMMUNICATION_MESSAGE_TYPE.SET_QR_TEXT:
        QrCreator.setText(request.qrText);

        // if the old QR code has already been generated/displayed, trigger re-generation
        if (initCompleted) {
            Logger.logInfo("Initialisation has already been completed, regenerate QR code with new text.");
            QrCreator.generate();
        }

        overwroteQrCode = true;

        sendResponse();
        break;
    }
}

/**
 * Returns whether the text has been overwritten.
 *
 * @name   BrowserCommunication.isTextOverwritten
 * @function
 * @private
 * @returns {boolean}
 */
export function isTextOverwritten() {
    return overwroteQrCode;
}

/**
 * Init context menu module.
 *
 * Adds menu elements.
 *
 * @name   BrowserCommunication.init
 * @function
 * @returns {void}
 */
export function init() {
    browser.runtime.onMessage.addListener(handleMessages);
}
