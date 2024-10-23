import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";
import { createMenu } from "/common/modules/ContextMenu.js";

const CONVERT_TEXT_SELECTION = "qr-convert-text-selection";
const CONVERT_LINK_TEXT_SELECTION = "qr-convert-link-text-selection";
const OPEN_OPTIONS = "qr-open-options";
const CONVERT_PAGE_URL = "qr-convert-page-url";

const MESSAGE_RESENT_TIMEOUT = 200; // ms
const MESSAGE_RESENT_MAX = 9;

let messageResentCount = 0;

/**
 * Send new text for the QR code.
 *
 * @private
 * @param {string} qrText
 * @returns {void}
 */
function sendQrCodeText(qrText) {
    console.info("send QR code text from background");
    browser.runtime.sendMessage({
        type: COMMUNICATION_MESSAGE_TYPE.SET_QR_TEXT,
        qrText: qrText
    }).then(() => {
        console.info(`QR code text "${qrText}" sent to tab successfully`);
    }).catch((e) => {
        // stop retrying after some time and just throw out error
        if (messageResentCount >= MESSAGE_RESENT_MAX) {
            throw e;
        }

        messageResentCount++;

        // recusively re-try message sending
        // This is e.g. needed when the popup has not yet opened and could not get the message.
        setTimeout(sendQrCodeText, MESSAGE_RESENT_TIMEOUT, qrText);
    });
}

/**
 * Creates the items in the context menu.
 *
 * @private
 * @returns {Promise}
 */
function createItems() {
    const selectionMenu = createMenu("contextMenuItemConvertSelection", {
        id: CONVERT_TEXT_SELECTION,
        contexts: ["selection"]
    });

    const linkMenu = createMenu("contextMenuItemConvertLinkSelection", {
        id: CONVERT_LINK_TEXT_SELECTION,
        contexts: ["link"]
    });

    const pageMenu = createMenu("contextMenuItemConvertPageURL", {
        id: CONVERT_PAGE_URL,
        contexts: ["page"]
    });

    browser.menus.refresh();

    // if listener is set, because items were hidden -> remove it
    browser.menus.onHidden.removeListener(createItems);

    return Promise.all([selectionMenu, linkMenu, pageMenu]);
}

/**
 * Triggers when a context menu item has been clicked.
 *
 * @private
 * @param {event} event
 * @returns {void}
 */
function menuClicked(event) {
    switch (event.menuItemId) {
    case CONVERT_TEXT_SELECTION:
        browser.browserAction.openPopup().then(() => {
            messageResentCount = 0;

            // send message to popup
            sendQrCodeText(event.selectionText);
        });
        break;
    case CONVERT_LINK_TEXT_SELECTION:
        browser.browserAction.openPopup().then(() => {
            messageResentCount = 0;

            // send message to popup
            sendQrCodeText(event.linkUrl);
        });
        break;
    case CONVERT_PAGE_URL:
        browser.browserAction.openPopup().then(() => {
            messageResentCount = 0;
            // Send the current page URL to the popup explicitly to overwrite any setting that may use a different string
            sendQrCodeText(event.pageUrl);
        });
        break;
    case OPEN_OPTIONS:
        browser.runtime.openOptionsPage();
        break;
    }
}

/**
 * Triggers when the menu is shown.
 *
 *
 *
 * @name   ContextMenu.menuShown
 * @function
 * @private
 * @param {event} info
 * @returns {void}
 */
function menuShown(info) {
    if (info.viewType !== "popup" || !info.pageUrl.startsWith(browser.runtime.getURL("."))) {
        return;
    }

    // if no of our own menus are shown, we do not need to do anything
    if (info.menuIds.length === 0) {
        return;
    }

    browser.menus.onHidden.addListener(createItems);

    browser.menus.remove(CONVERT_TEXT_SELECTION);
    browser.menus.remove(CONVERT_LINK_TEXT_SELECTION);
    browser.menus.remove(CONVERT_PAGE_URL);

    browser.menus.refresh();
}

/**
 * Init context menu module.
 *
 * Adds menu elements.
 *
 * @private
 * @returns {Promise}
 */
export function init() {
    return createItems().then(() => {
        browser.menus.onClicked.addListener(menuClicked);
        browser.menus.onShown.addListener(menuShown);
        browser.runtime.onMessage.addListener((message) => {
            if (message.action === "enableContextMenu") {
                browser.menus.update(CONVERT_PAGE_URL, { visible: true });
                console.log("Context menu enabled");
            } else if (message.action === "disableContextMenu") {
                browser.menus.update(CONVERT_PAGE_URL, { visible: false });
                console.log("Context menu disabled");
            }
            browser.menus.refresh();
        });    
    });
}
