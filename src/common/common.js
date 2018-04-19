'use strict';

// Globals
const ADDON_NAME = "Offline QR code generator";
const ADDON_NAME_SHORT = "Offline QR code";

// "Enums"
const MESSAGE_LEVEL = Object.freeze({
    "ERROR": 3,
    "WARN": 2,
    "INFO": 1,
    "SUCCESS": -3,
});

var Logger = (function () {
    let me = {};

    const DEBUG_MODE = true;

    const MESSAGE_LEVEL_NAME = Object.freeze({
        [MESSAGE_LEVEL.ERROR]: "ERROR",
        [MESSAGE_LEVEL.WARN]: "WARN",
        [MESSAGE_LEVEL.INFO]: "INFO",
        [MESSAGE_LEVEL.SUCCESS]: "SUCCESS"
    });

    /**
     * Logs a string to console.
     *
     * Pass as many strings/output as you want.
     * For brevity, better prefer the other functions (logError, etc.) instead
     * of this one.
     *
     * @name   Logger.log
     * @function
     * @param  {MESSAGE_LEVEL} messagetype
     * @param  {...*} args
     */
    me.log = function() {
        if (arguments.length < 0) {
            // recursive call, it's secure, because this won't fail
            return me.log(MESSAGE_LEVEL.ERROR, "log has been called without parameters");
        }

        const args = Array.from(arguments);
        const messagetype = args[0];
        args[0] = ADDON_NAME_SHORT + " [" + MESSAGE_LEVEL_NAME[messagetype] + "]";

        switch (messagetype) {
            case MESSAGE_LEVEL.ERROR:
                console.error.apply(null, args);
                break;
            case MESSAGE_LEVEL.WARN:
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
        args.unshift(MESSAGE_LEVEL.ERROR);

        me.log.apply(null, args);
    };

    /**
     * Logs a warning.
     *
     * @name   Logger.logWarning
     * @function
     * @param  {...*} args
     */
    me.logWarning = function() {
        const args = Array.from(arguments);
        args.unshift(MESSAGE_LEVEL.WARN);

        me.log.apply(null, args);
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
        if (DEBUG_MODE === false) {
            return;
        }

        const args = Array.from(arguments);
        args.unshift(MESSAGE_LEVEL.INFO);

        me.log.apply(null, args);
    };

    return me;
})();

var Localizer = (function () {
    let me = {};

    const I18N_ATTRIBUTE = "data-i18n";

    const LOCALIZED_ATTRIBUTES = [
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
        LOCALIZED_ATTRIBUTES.forEach((currentAttribute) => {
            const currentLocaleAttribute = `${I18N_ATTRIBUTE}-${currentAttribute}`;

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
        document.querySelectorAll(`[${I18N_ATTRIBUTE}]`).forEach((currentElem) => {
            Logger.logInfo("init translate", currentElem);

            const contentString = currentElem.getAttribute(I18N_ATTRIBUTE);
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
        popupIconColored: false,
        qrColor: "#0c0c0d",
        qrBackgroundColor: "#ffffff",
        qrErrorCorrection: 'Q',
        monospaceFont: false
    }

    /**
     *  Get the default value
     *
     * Returns undefined, if option cannot be found.
     *
     * @name   AddonSettings.getDefaultValue
     * @function
     * @param  {string|null} option name of the option
     * @returns {object|undefined}
     */
    me.getDefaultValue = function (option) {
        // return all default values
        if (!option) {
            return defaultValues;
        }

        // if undefined
        if (defaultValues.hasOwnProperty(option)) {
            return defaultValues[option];
        } else {
            Logger.logError(`Default value for "${option}" missing.`);
            return undefined;
        }
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

var MessageHandler = (function () {
    let me = {};

    // const elWarning = document.getElementById('messageWarning');

    const ELEMENT_BY_TYPE = Object.freeze({
        [MESSAGE_LEVEL.ERROR]: document.getElementById('messageError'),
        [MESSAGE_LEVEL.WARN]: document.getElementById('messageWarning'),
        [MESSAGE_LEVEL.INFO]: document.getElementById('messageInfo'),
        [MESSAGE_LEVEL.SUCCESS]: document.getElementById('messageSuccess')
    });

    let hooks = {
        'global': {
            'show': null,
            'hide': null,
        },
        [MESSAGE_LEVEL.ERROR]: {
            'show': null,
            'hide': null,
        },
        [MESSAGE_LEVEL.WARN]: {
            'show': null,
            'hide': null,
        },
        [MESSAGE_LEVEL.INFO]: {
            'show': null,
            'hide': null,
        },
        [MESSAGE_LEVEL.SUCCESS]: {
            'show': null,
            'hide': null,
        },
    };

    /**
     * Runs a hook set by some module.
     *
     * It automatically also runs the global hook, but you can still specify a
     * 'global' to ruin it manually.
     *
     * @name   MessageHandler.hideMessage
     * @function
     * @private
     * @param  {MESSAGE_LEVEL|global} messagetype
     * @param  {string} hooktype the type you want to call
     * @param  {object} param the parameter to pass to the function
     */
    function runHook(messagetype, hooktype, param) {
        if (hooktype != 'global') {
            // recursively run myself for global hook first
            runHook(messagetype, 'global', param);
        }

        const hook = hooks[messagetype][hooktype];
        if (hook !== null && hook !== undefined) {
            hookhook(param);
        }
    }

    /**
     * Shows a message to the user.
     *
     * Pass as many strings/output as you want. They will be localized
     * automatically, before presented to the user.
     *
     * @name   MessageHandler.showMessage
     * @function
     * @private
     * @param  {MESSAGE_LEVEL} messagetype
     * @param  {...*} args
     */
    function showMessage() {
        if (arguments.length < 0) {
            return Logger.logError("MessageHandler.showMessage has been called without parameters");
        }

        const args = Array.from(arguments);

        // also log message to console
        Logger.log.apply(null, args);

        // get first element
        const messagetype = args.shift();

        // localize string or fallback to first string ignoring all others
        const localizedString = browser.i18n.getMessage.apply(null, args) || args[0] || browser.i18n.getMessage("errorShowingMessage");

        // get element by message type
        const elMessage = ELEMENT_BY_TYPE[messagetype];
        if (!elMessage) {
            return Logger.logError("The message could not be shown, because the DOM element is missing.", messagetype, args);
        }

        elMessage.textContent = localizedString;
        elMessage.classList.remove("invisible");
    }

    /**
     * Hides the message type(s), you specify.
     *
     * If you pass no messagetype or "null", it hides all messages.
     *
     * @name   MessageHandler.hideMessage
     * @function
     * @private
     * @param  {MESSAGE_LEVEL} messagetype
     */
    function hideMessage(messagetype) {
        if (messagetype !== undefined && messagetype !== null) {
            ELEMENT_BY_TYPE[messagetype].classList.add("invisible");
            return;
        }

        // hide all of them, otherwise
        MESSAGE_LEVEL.forEach((currentType) => {
            // recursive call myself to hide element
            me.hideMessage(currentType);
        })
    }

    /**
     * Hides the error message.
     *
     * @name   MessageHandler.hideError
     * @function
     */
    me.hideError = function() {
        runHook(MESSAGE_LEVEL.ERROR, "hide");
        hideMessage(MESSAGE_LEVEL.ERROR);
    }

    /**
     * Hide error message.
     *
     * @name   MessageHandler.hideError
     * @function
     */
    me.hideWarning = function() {
        runHook(MESSAGE_LEVEL.WARN, "hide");
        hideMessage(MESSAGE_LEVEL.WARN);
    }

    /**
     * Hide info message.
     *
     * @name   MessageHandler.hideInfo
     * @function
     */
    me.hideInfo = function() {
        runHook(MESSAGE_LEVEL.INFO, "hide");
        hideMessage(MESSAGE_LEVEL.INFO);
    }

    /**
     * Hide success message.
     *
     * @name   MessageHandler.hideSuccess
     * @function
     */
    me.hideSuccess = function() {
        runHook(MESSAGE_LEVEL.SUCCESS, "hide");
        hideMessage(MESSAGE_LEVEL.SUCCESS);
    }

    /**
     * Show a critical error.
     *
     * Note this should only be used to show *short* error messages, which are
     * meaningfull to the user, as the space is limited. So it is mostly only
     * useful to use only one param: a string.
     * Also pay attention to the fact, that it currently can only show one error
     * once.
     *
     * @name   MessageHandler.showError
     * @function
     * @param  {...*} args
     */
    me.showError = function() {
        const args = Array.from(arguments);

        runHook(MESSAGE_LEVEL.ERROR, "show", args);

        args.unshift(MESSAGE_LEVEL.ERROR);
        showMessage.apply(null, args);
    };

    /**
     * Show an warning message.
     *
     * @name   MessageHandler.showWarning
     * @function
     * @param  {...*} args
     */
    me.showWarning = function() {
        const args = Array.from(arguments);

        runHook(MESSAGE_LEVEL.WARN, "show", args);

        args.unshift(MESSAGE_LEVEL.WARN);
        showMessage.apply(null, args);
    };

    /**
     * Show an info message.
     *
     * @name   MessageHandler.showInfo
     * @function
     * @param  {...*} args
     */
    me.showInfo = function() {
        const args = Array.from(arguments);

        runHook(MESSAGE_LEVEL.INFO, "show", args);

        args.unshift(MESSAGE_LEVEL.INFO);
        showMessage.apply(null, args);
    };

    /**
     * Show a success message.
     *
     * @name   MessageHandler.showSuccess
     * @function
     * @param  {...*} args
     */
    me.showSuccess = function() {
        const args = Array.from(arguments);

        runHook(MESSAGE_LEVEL.SUCCESS, "show", args);

        args.unshift(MESSAGE_LEVEL.SUCCESS);
        showMessage.apply(null, args);
    };

    /**
     * Let's other functions set a hook to be called when a message type is
     * shown or hidden.
     *
     * Set parameters to null or undefined (i.e. do not set) in order to disable
     * the hook.
     * The errorShown function gets one parameter: The arguments passed to the
     * function, as an array.
     *
     * @name   MessageHandler.setHooksetHook
     * @function
     * @param  {MESSAGE_LEVEL|string} messagetype use string "global" for a global hook
     * @param {function} hookShown
     * @param {function} hookHidden
     */
    me.setHook = function(messagetype, hookShown, hookHidden) {
        hooks[messagetype].show = hookShown;
        hooks[messagetype].hide = hookHidden;
    }

    return me;
})();

// init modules
Localizer.init();
