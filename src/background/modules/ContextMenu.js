import * as Logger from "/common/modules/Logger.js";

const CONVERT_TEXT_SELECTION = "qr-convert-text-selection";
const CONVERT_LINK_TEXT_SELECTION = "qr-convert-link-text-selection";
const OPEN_OPTIONS = "qr-open-options";
// TODO: This constant should be usable for all scripts.
const COMMUNICATION_MESSAGE_TYPE = Object.freeze({
    "SET_QR_TEXT": "setQrText",
});

const MESSAGE_RESENT_TIMEOUT = 200; // ms

/**
 * Log error while creating menu item.
 *
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
 * @function
 * @private
 * @param {string} qrText
 * @returns {void}
 */
function sendQrCodeText(qrText) {
    Logger.logInfo("send QR code text from background");
    browser.runtime.sendMessage({
        type: COMMUNICATION_MESSAGE_TYPE.SET_QR_TEXT,
        qrText: qrText
    }).then(() => {
        Logger.logInfo(`QR code text "${qrText}" sent to tab successfully`);
    }).catch(() => {
        // recusively re-try message sending
        // This is e.g. needed when the popup has not yet opened and could not get the message.
        setTimeout(sendQrCodeText, MESSAGE_RESENT_TIMEOUT, qrText);
    });
}

/**
 * Creates the items in the context menu.
 *
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

}

/**
 * Triggers when a context menu item has been clicked.
 *
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
 * @function
 * @returns {void}
 */
export function init() {
    createItems();
    browser.menus.onClicked.addListener(menuClicked);
}

Logger.logInfo("ContextMenu module loaded.");
