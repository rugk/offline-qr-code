/**
 * Receives the messages sent by the popup.
 *
 * Currently it is used to save files even if the popup is closed.
 *
 * @module modules/ReceivePopupMessages
 * @requires /common/modules/Logger
 * @requires /common/modules/BrowserCommunication
 * @requires /common/modules/data/BrowserCommunicationTypes
 */

import * as Logger from "/common/modules/Logger.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication.js";

import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

const SAVE_AS_RETRY_TIMEOUT = 500; // ms
// MAX_SAVE_AS_RETRIES * 0,SAVE_AS_RETRY_TIMEOUT s = 30s retries
// 60x * 0,5s = 30s retries = retry for one minute
const MAX_SAVE_AS_RETRIES = 60;

// whether to retry the file saving or not, acts both as a status indicator and a setting
let saveFileAsRetry = null;
let saveAsRetries = 0;

/**
 * Handles the event when we need to save an SVG file from a popup.
 *
 * This is basically a workaround for {@link https://bugzilla.mozilla.org/show_bug.cgi?id=1461134}.
 *
 * @function
 * @private
 * @param {Object} request
 * @param {Object} sender
 * @param {function} sendResponse
 * @returns {Promise}
 */
function saveFileAs(request, sender, sendResponse) {
    Logger.logInfo("trigger saveAs download of", request.filename, "retry #", saveAsRetries);

    // if we should handle permission errors and apply re-try workaround
    // that's the actual workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1292701
    if (request.usePermissionWorkaround && saveFileAsRetry) {
        // if permission is not yet granted
        if (browser.downloads === undefined) {
            // stop retrying at maximum time
            // (this happens when the user just declines the permission request)
            if (saveAsRetries >= MAX_SAVE_AS_RETRIES) {
                // stop re-trying
                saveFileAsRetry = false;
                throw new Error("saveAs retry timeout");
            }

            return new Promise((resolve, reject) => {
                // try again after some time and return as Promise
                setTimeout(() => {
                    saveAsRetries++;

                    return saveFileAs(request, sender, sendResponse).then(() => {
                        resolve();
                    }).catch((error) => {
                        reject(error);
                    });
                }, SAVE_AS_RETRY_TIMEOUT);
            });
        } else {
            // stop actually retrying after actually triggering the download below
            saveFileAsRetry = false;
        }
    }

    const objectUrl = URL.createObjectURL(request.file);

    // cleanup object URL after download is completed
    browser.downloads.onChanged.addListener((delta) => {
        if (!delta.state || delta.state.current !== "complete") {
            return;
        }

        Logger.logInfo("objectUrl revoked:", objectUrl);
        URL.revokeObjectURL(objectUrl);
    });

    return browser.downloads.download({
        url: objectUrl,
        filename: request.filename,
        saveAs: true
    }).then(() => {
        // send response
        sendResponse();
    });
}

// add listener
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.SAVE_FILE_AS, (request, sender, sendResponse) => {
    // if retrying is already triggered just reset timer, but do not call again
    // (calling again would result in the file being saved multiple times)
    if (request.usePermissionWorkaround && saveFileAsRetry) {
        saveAsRetries = 0;
        return null; // cannot return a Promise here, as chain is already running
    }

    saveFileAsRetry = request.usePermissionWorkaround;
    saveAsRetries = 0;

    return saveFileAs(request, sender, sendResponse);
});

BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.SAVE_FILE_AS_STOP_RETRY, () => {
    saveFileAsRetry = false;
});

