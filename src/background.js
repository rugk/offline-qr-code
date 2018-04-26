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
            console.log(`error creating item: ${lastError}`);
        } else {
            console.log("item created successfully");
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
            type: "setQrText",
            qrText
        }).then(() => {
            console.log(`QR code text "${qrText}" sent to tab successfully`);
        }).catch(() => {
            // recusively re-try message sending
            setTimeout(sendQrCodeText, MESSAGE_RESENT_TIMEOUT, qrText);
        });
    }

    /**
     * Triggers when a menu it clicked.
     *
     * @name   ContextMenu.menuClicked
     * @function
     * @private
     * @param {event} event
     * @returns {void}
     */
    function menuClicked(event) {
        switch (event.menuItemId) {
        case "generateQrCode":
            browser.browserAction.openPopup().then(() => {
                // send message to popup
                sendQrCodeText(event.selectionText);
            });
            break;
        case "qrCodeOptions":
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
        browser.menus.create({
            id: "generateQrCode",
            title: browser.i18n.getMessage("contextMenuQrCode"),
            contexts: ["selection"]
        }, onCreated);

        browser.menus.create({
            id: "qrCodeOptions",
            title: browser.i18n.getMessage("contextMenuSettings"),
            contexts: ["browser_action"]
        }, onCreated);

        browser.menus.onClicked.addListener(menuClicked);
    };

    return me;
})();

// init modules
IconHandler.init();
ContextMenu.init();
