"use strict";

const IconHandler = (function () {
    const me = {};

    /**
     * Sets a popup icon variant.
     *
     * @name   IconHandler.setPopupIcon
     * @function
     * @private
     * @param {string} icon version or "null"/"undefined" to reset to default
     * @returns {void}
     */
    function setPopupIcon(icon) {
        // verify parameter
        switch (icon) {
        case "dark": // fall through
        case "light":
        case "colored":
        case null:
            // ok
            break;
        default:
            throw Error(`invalid parameter: ${icon}`);
        }

        if (icon === null || icon === undefined) {
            browser.browserAction.setIcon({path: null});
            return;
        }

        browser.browserAction.setIcon({path: `icons/icon-small-${icon}.svg`});
    }

    /**
     * Init icon module.
     *
     * @name   IconHandler.init
     * @function
     * @returns {void}
     */
    me.init = function() {
        // TODO: use common thing here
        browser.storage.sync.get("popupIconColored").then((res) => {
            const popupIconColored = res.popupIconColored;

            if (popupIconColored === true) {
                setPopupIcon("colored");
            } else {
                // reset icon
                setPopupIcon(null);
            }
        });
    };

    return me;
})();

const ContextMenu = (function () {
    const me = {};

    const CONVERT_TEXT_SELECTION = "qr-convert-text-selection";
    const CONVERT_LINK_TEXT_SELECTION = "qr-convert-link-text-selection";
    const OPEN_OPTIONS = "qr-open-options";

    // TODO: This constant should be usable for all scripts.
    const COMMUNICATION_MESSAGE_TYPE = Object.freeze({
        "SET_QR_TEXT": "setQrText",
    });

    const MESSAGE_RESENT_TIMEOUT = 100; // ms

    /**
     * Log error while creating menu item.
     *
     * @name   ContextMenu.onCreated
     * @function
     * @private
     * @returns {void}
     */
    function onCreated() {
        const lastError = browser.runtime.lastError;

        /* eslint-disable no-console */
        if (lastError) {
            console.log(`error creating menu item: ${lastError}`);
        } else {
            console.log("menu item created successfully");
        }
        /* eslint-enable no-console */
    }

    /**
     * Send new text for the QR code.
     *
     * @name   ContextMenu.sendQrCodeText
     * @function
     * @private
     * @param {string} qrText
     * @returns {void}
     */
    function sendQrCodeText(qrText) {
        browser.runtime.sendMessage({
            type: COMMUNICATION_MESSAGE_TYPE.SET_QR_TEXT,
            qrText: qrText
        }).then(() => {
            console.log(`QR code text "${qrText}" sent to tab successfully`); // TODO: we need the Logger here…
        }).catch(() => {
            // recusively re-try message sending
            setTimeout(sendQrCodeText, MESSAGE_RESENT_TIMEOUT, qrText);
        });
    }
    /**
     * Creates the items in the context menu.
     *
     * @name   ContextMenu.createItems
     * @function
     * @returns {void}
     */
    function createItems() {
        browser.menus.create({
            id: CONVERT_TEXT_SELECTION,
            title: browser.i18n.getMessage("contextMenuItemConvertSelection"),
            contexts: ["selection"]
        }, onCreated);

        browser.menus.create({
            id: CONVERT_LINK_TEXT_SELECTION,
            title: browser.i18n.getMessage("contextMenuItemConvertLinkSelection"),
            contexts: ["link"]
        }, onCreated);

        browser.menus.create({
            id: OPEN_OPTIONS,
            title: browser.i18n.getMessage("contextMenuItemOptions"),
            contexts: ["browser_action"]
        }, onCreated);
    }

    /**
     * Triggers when a context menu item has been clicked.
     *
     * @name   ContextMenu.menuClicked
     * @function
     * @private
     * @param {event} event
     * @returns {void}
     */
    function menuClicked(event) {
        switch (event.menuItemId) {
        case CONVERT_TEXT_SELECTION:
            browser.browserAction.openPopup().then(() => {
                // send message to popup
                sendQrCodeText(event.selectionText);
            });
            break;
        case CONVERT_LINK_TEXT_SELECTION:
            browser.browserAction.openPopup().then(() => {
                // send message to popup
                sendQrCodeText(event.linkUrl);
            });
            break;
        case OPEN_OPTIONS:
            browser.runtime.openOptionsPage();
            break;
        }
    }

    /**
     * Init context menu module.
     *
     * Adds menu elements.
     *
     * @name   ContextMenu.init
     * @function
     * @returns {void}
     */
    me.init = function() {
        createItems();
        browser.menus.onClicked.addListener(menuClicked);
    };

    return me;
})();

// TODO: combine with module in qrcode.js as a new module?
const BrowserCommunication = (function () {
    const me = {};

    const COMMUNICATION_MESSAGE_TYPE = Object.freeze({
        SAVE_FILE_AS: "saveFileAs",
    });
    const SAVE_AS_RETRY_TIMEOUT = 500; // ms
    // MAX_SAVE_AS_RETRIES * 0,SAVE_AS_RETRY_TIMEOUT s = 30s retries
    // 60x * 0,5s = 30s retries = retry for one minute
    const MAX_SAVE_AS_RETRIES = 60;

    let saveFileAsContinueRetry = true;
    let saveAsRetries = 0;

    /**
     * Handles the event when we need to save an SVG file from a popup.
     *
     * This is basically a workaround for {@link https://bugzilla.mozilla.org/show_bug.cgi?id=1461134}.
     *
     * @name   ContextMenu.saveFileAs
     * @function
     * @private
     * @param {Object} request
     * @param {Object} sender
     * @param {function} sendResponse
     * @returns {Promise}
     */
    function saveFileAs(request, sender, sendResponse) {
        console.log("trigger saveAs download of", request.filename, "retry #", saveAsRetries);

        // if we should handle permission errors and apply re-try workaround
        // that's the actual workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1292701
        if (request.usePermissionWorkaround && saveFileAsContinueRetry) {
            // if permission is not yet granted
            if (browser.downloads === undefined) {
                // stop retrying at maximum time
                // (this happens when the user just declines the permission request)
                if (saveAsRetries >= MAX_SAVE_AS_RETRIES) {
                    return new Promise((resolve, reject) => {
                        reject(new Error("saveAs retry timeout"));
                    });
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
                // stop actually retrying after this execution
                saveFileAsContinueRetry = false;
            }
        }

        const objectUrl = URL.createObjectURL(request.file);

        // cleanup object URL after download is completed
        browser.downloads.onChanged.addListener((delta) => {
            if (!delta.state || delta.state.current !== "complete") {
                return;
            }

            console.log("objectUrl revoked:", objectUrl);
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

    /**
     * Handles messages received by other parts.
     *
     * @name   BrowserCommunication.handleMessages
     * @function
     * @private
     * @param {Object} request
     * @param {Object} sender
     * @param {function} sendResponse
     * @returns {Promise|null}
     */
    function handleMessages(request, sender, sendResponse) {
        console.log("Got message", request, "from", sender);

        // declararations here make sense
        /* eslint-disable no-case-declarations */

        switch (request.type) {
        case COMMUNICATION_MESSAGE_TYPE.SAVE_FILE_AS:
            saveFileAsContinueRetry = request.usePermissionWorkaround;
            saveAsRetries = 0;

            return saveFileAs(request, sender, sendResponse);
        case COMMUNICATION_MESSAGE_TYPE.SAVE_FILE_AS_STOP_RETRY:
            saveFileAsContinueRetry = true;
        }
        /* eslint-enable no-case-declarations */

        return null;
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
    me.init = function() {
        browser.runtime.onMessage.addListener(handleMessages);
    };

    return me;
})();

// init modules
IconHandler.init();
ContextMenu.init();
BrowserCommunication.init();
