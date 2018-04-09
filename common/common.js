'use strict';

// Globals
const ADDON_NAME = "Offline QR code generator";
const ADDON_NAME_SHORT = "Offline QR code";

var Logger = (function () {
    let me = {};

    const debugMode = true;

    /**
     * Logs a string to console.
     *
     * Pass as many strings/output as you want.
     *
     * @name   Logger.log
     * @function
     * @private
     * @param  {string} errortype
     * @param  {...*} args
     */
    function log() {
        if (arguments.length < 0) {
            // recursive call, it's secure, because this won't fail
            return log("ERROR", "log has been called without parameters");
        }

        const args = Array.from(arguments);
        const errortype = args[0];
        args[0] = ADDON_NAME_SHORT + " [" + errortype + "]";

        switch (errortype) {
            case "ERROR":
                console.error.apply(null, args);
                break;
            case "WARN":
                console.warn.apply(null, args);
                break;
            default:
                console.log.apply(null, args);
        }
    }

    /**
     * Logs a fatal error.
     *
     * @name   Logger.logError
     * @function
     * @param  {...*} args
     */
    me.logError = function() {
        const args = Array.from(arguments);
        args.unshift("INFO");

        log.apply(null, args);
    };

    /**
     * Logs some information.
     *
     * Note: This log may be skipped, when not in debug mode.
     *
     * @name   Logger.logInfo
     * @function
     * @param  {...*} args
     */
    me.logInfo = function() {
        if (debugMode === false) {
            return;
        }

        const args = Array.from(arguments);
        args.unshift("INFO");

        log.apply(null, args);
    };

    return me;
})();

var Localizer = (function () {
    let me = {};

    const i18nAttribute = "data-i18n";

    const localizedAttributes = [
        "placeholder",
        "alt"
    ];

    /**
     * Splits the _MSG__*__ format and returns the actual tag.
     *
     * @name   Localizer.getMessageFromTag
     * @function
     * @private
     * @param  {string} tag
     * @returns {string}
     */
    function getMessageTag(tag) {
        const splitMessage = tag.split(/^__MSG_(\w+)__$/);

        // this may throw exceptions, but then the input is just invalid
        return splitMessage[1];
    }

    /**
     * Logs a string to console.
     *
     * Pass as many strings/output as you want.
     *
     * @name   Localizer.replaceI18n
     * @function
     * @private
     * @param  {HTMLElement} elem element to translate
     * @param  {string} tag name of the
     */
    function replaceI18n(elem, tag) {
        // localize main content
        if (tag != "") {
            elem.textContent = browser.i18n.getMessage(getMessageTag(tag));
        }

        // replace attributes
        localizedAttributes.forEach((currentAttribute) => {
            const currentLocaleAttribute = `${i18nAttribute}-${currentAttribute}`;

            if (elem.hasAttribute(currentLocaleAttribute)) {
                const attributeTag = elem.getAttribute(currentLocaleAttribute);
                elem.setAttribute(currentAttribute, browser.i18n.getMessage(getMessageTag(attributeTag)));
            }
        });
    }

    /**
     * Localizes static strings in the HTML file.
     *
     * @name   Localizer.init
     * @function
     */
    me.init = function() {
        document.querySelectorAll(`[${i18nAttribute}]`).forEach((currentElem) => {
            Logger.logInfo("init translate", currentElem);

            const contentString = currentElem.getAttribute(i18nAttribute);
            replaceI18n(currentElem, contentString);
        });

        // replace html lang attribut after translation
        document.querySelectorAll("html")[0].setAttribute("lang", browser.i18n.getUILanguage());
    };

    return me;
})();

// init modules
Localizer.init();
