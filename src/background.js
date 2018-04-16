'use strict';

/* globals Logger */
/* globals AddonSettings */
/* globals MessageHandler */
/* globals ADDON_NAME */
/* globals ADDON_NAME_SHORT */
/* globals MESSAGE_LEVEL */

var IconHandler = (function () {
    let me = {};

    /**
     * Sets a popup icon variant.
     *
     * @name   IconHandler.setPopupIcon
     * @function
     * @private
     * @param {string} icon version or "null"/"undefined" to reset to default
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
                throw Error("invalid parameter: " + icon);
        }

        if (icon === null || icon == undefined) {
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

IconHandler.init();
