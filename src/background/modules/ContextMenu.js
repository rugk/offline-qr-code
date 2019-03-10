import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";
import { createMenu } from "/common/modules/ContextMenu.js";

const CONVERT_TEXT_SELECTION = "qr-convert-text-selection";
const CONVERT_LINK_TEXT_SELECTION = "qr-convert-link-text-selection";
const OPEN_OPTIONS = "qr-open-options";

const MESSAGE_RESENT_TIMEOUT = 200; // ms

/**
 * Log error while creating menu item.
 *
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
    }).catch(() => {
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
    }, onCreated);

    const linkMenu = createMenu("contextMenuItemConvertLinkSelection", {
        id: CONVERT_LINK_TEXT_SELECTION,
        contexts: ["link"]
    }, onCreated);

    browser.menus.refresh();

    // if listener is set, because items were hidden -> remove it
    browser.menus.onHidden.removeListener(createItems);

    return Promise.all([selectionMenu, linkMenu]);
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
    });
}
