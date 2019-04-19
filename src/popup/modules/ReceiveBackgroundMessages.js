/**
 * Receives the messages sent by the background script.
 *
 * Currently it is just used to set the QR code to a custom string instead of the default URL.
 *
 * @module modules/ReceiveBackgroundMessages
 * @requires /common/modules/Logger
 * @requires /common/modules/BrowserCommunication
 * @requires /common/modules/data/BrowserCommunicationTypes
 * @requires ./QrCreator
 * @requires ./InitQrCode
 */

import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";

import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

import * as QrCreator from "./QrCreator.js";
import { initCompleted } from "./InitQrCode.js";

let overwroteQrCode = false;

// add listener
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.SET_QR_TEXT, (request, sender, sendResponse) => {
    QrCreator.setText(request.qrText);

    // if the old QR code has already been generated/displayed, trigger re-generation
    if (initCompleted) {
        console.info("Initialisation has already been completed, regenerate QR code with new text.");
        QrCreator.generate();
    }

    overwroteQrCode = true;

    sendResponse();
});

/**
 * Returns whether the text has been overwritten.
 *
 * @function
 * @private
 * @returns {boolean}
 */
export function isTextOverwritten() {
    return overwroteQrCode;
}
