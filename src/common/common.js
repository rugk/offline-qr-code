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
            const translatedMessage = browser.i18n.getMessage(getMessageTag(tag));
            // only set message if it could be retrieved, i.e. do not override HTML fallback
            if (translatedMessage != "") {
              elem.textContent = translatedMessage;
            }
        }

        // replace attributes
        localizedAttributes.forEach((currentAttribute) => {
            const currentLocaleAttribute = `${i18nAttribute}-${currentAttribute}`;

            if (elem.hasAttribute(currentLocaleAttribute)) {
                const attributeTag = elem.getAttribute(currentLocaleAttribute);
                const translatedMessage = browser.i18n.getMessage(getMessageTag(attributeTag));
                // only set message if it could be retrieved, i.e. do not override HTML fallback
                if (translatedMessage != "") {
                  elem.setAttribute(currentAttribute, translatedMessage);
                }
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

var AddonSettings = (function () {
    let me = {};

    const defaultValues = {
        qrColor: "#0c0c0d",
    }

    /**
     *  Get the default value
     *
     * Returns undefined, if option cannot be found.
     *
     * @name   AddonSettings.getDefaultValue
     * @function
     * @param  {string|null} option name of the option
     * @returns {object}
     */
    me.getDefaultValue = function (option) {
        // return all default values
        if (!option) {
            return defaultValues;
        }

        const optionValue = defaultValues[option];

        // if undefined
        if (!optionValue) {
            Logger.logError(`Default value for "${option}" missing.`);
            return undefined;
        }

        return optionValue;
    }

    /**
     * Returns the add-on setting to use in add-on.
     *
     * @name   AddonSettings.get
     * @function
     * @param  {string|null} option name of the option
     * @return {Promise}
     */
    me.get = function(option) {
        option = option || null;

        // if all values should be returned, first fetch default ones
        let addValues = null;
        if (!option) {
            addValues = me.getDefaultValue(option);
        }

        // first try to get managed option
        return browser.storage.managed.get(option).then((res) => {
            Logger.logInfo(`Managed setting got for "${option}".`, res);

            // merge objects if needed
            if (addValues !== null) {
                return Object.assign({}, addValues, res);
            }

            return res;
        }).catch((error) => {
            // get synced option, otherwise
            return browser.storage.sync.get(option).then((res) => {
                Logger.logInfo(`Setting got for "${option}".`, res);

                if (addValues !== null) {
                    return Object.assign({}, addValues, res);
                }

                return res;
            }).catch((error) => {
                // last fallback: default value
                Logger.logError(`Could not get option "${option}". Using default.`, error);

                // get default value as a last fallback
                return me.getDefaultValue(option) || null;
            });
        });
    };

    return me;
})();
// init modules
Localizer.init();
