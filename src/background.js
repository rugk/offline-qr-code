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
     * @param {string} icon version
     */
    function setPopupIcon(icon) {
        // verify parameter
        switch (icon) {
            case "dark": // fall through
            case "light":
                // ok
                break;
            default:
                throw Error("invalid parameter: " + icon);
        }

        browser.browserAction.setIcon({path: `icons/icon-small-${icon}.svg`});
    }

    /**
     * Resets the icon as the theme changed.
     *
     * @name   IconHandler.themeChanged
     * @function
     * @private
     * @param {object} theme
     */
    function themeChanged(theme) {
        console.log(theme);
        if (!theme.hasOwnProperty("colors")) {
            return;
        }

        // get theme color
        const itemColor = theme.colors.toolbar_text || theme.colors.textcolor;
        console.log("new theme", itemColor);
    }

    /**
     * Init icon module.
     *
     * @name   IconHandler.init
     * @function
     */
    me.init = function() {
        // browser.theme.getCurrent().then(themeChanged);
        browser.storage.sync.get("popupIconColor").then((res) => {
            const popupIconClor = res.popupIconColor;
            setPopupIcon(popupIconClor);
        });

        // set listener
        // browser.theme.onUpdated.addListener(themeChanged);
    };

    return me;
})();

/* DISABLED CURRENTLY */
IconHandler.init();
