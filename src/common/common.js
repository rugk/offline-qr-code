"use strict";

// lodash

// Globals
const ADDON_NAME = "Offline QR code generator"; // eslint-disable-line no-unused-vars
const ADDON_NAME_SHORT = "Offline QR code";

// "Enums"
const MESSAGE_LEVEL = Object.freeze({
    "ERROR": 3,
    "WARN": 2,
    "INFO": 1,
    "LOADING": -2,
    "SUCCESS": -3
});

/* GLOBAL FUNCTIONS */

/**
 * Determinates whether an object is empty or not.
 *
 * @name   objectIsEmpty
 * @function
 * @param  {Object} obj
 * @returns {boolean}
 */
function objectIsEmpty(obj) { // eslint-disable-line no-unused-vars
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

const Logger = (function () {
    const me = {};

    let debugMode = null;

    const MESSAGE_LEVEL_NAME = Object.freeze({
        [MESSAGE_LEVEL.ERROR]: "ERROR",
        [MESSAGE_LEVEL.WARN]: "WARN",
        [MESSAGE_LEVEL.INFO]: "INFO",
        [MESSAGE_LEVEL.LOADING]: "LOADING",
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
     * @returns {void}
     */
    me.log = function(...args) {
        if (arguments.length < 0) {
            // recursive call, it's secure, because this won't fail
            me.log(MESSAGE_LEVEL.ERROR, "log has been called without parameters");
            return;
        }

        const messagetype = args[0];
        args[0] = `${ADDON_NAME_SHORT} [${MESSAGE_LEVEL_NAME[messagetype]}]`;

        /* eslint-disable no-console */
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
        /* eslint-enable no-console */
    };

    /**
     * Logs a fatal error.
     *
     * @name   Logger.logError
     * @function
     * @param  {...*} args
     * @returns {void}
     */
    me.logError = function(...args) {
        args.unshift(MESSAGE_LEVEL.ERROR);

        me.log.apply(null, args);
    };

    /**
     * Logs a warning.
     *
     * @name   Logger.logWarning
     * @function
     * @param  {...*} args
     * @returns {void}
     */
    me.logWarning = function(...args) {
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
     * @returns {void}
     */
    me.logInfo = function(...args) {
        // skip log only, when deliberately disabled!
        if (debugMode === false) {
            return;
        }

        args.unshift(MESSAGE_LEVEL.INFO);

        me.log.apply(null, args);
    };

    /**
     * Enable or disable the debug mode.
     *
     * @name   Logger.setDebugMode
     * @function
     * @param  {boolean} isDebug
     * @returns {void}
     */
    me.setDebugMode = function(isDebug) {
        debugMode = isDebug;
    };

    /**
     * Inits some information.
     *
     * @name   Logger.init
     * @function
     * @returns {void}
     */
    me.init = function() {
        AddonSettings.get("debugMode").then((isDebug) => {
            me.setDebugMode(isDebug);
        });
    };

    return me;
})();

const Localizer = (function () {
    const me = {};

    const I18N_ATTRIBUTE = "data-i18n";

    const LOCALIZED_ATTRIBUTES = [
        "placeholder",
        "alt",
        "href",
        "aria-label"
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
     * @param  {HTMLElement} elem
     * @param  {string} tag
     * @returns {void}
     */
    function replaceI18n(elem, tag) {
        // localize main content
        if (tag !== "") {
            const translatedMessage = browser.i18n.getMessage(getMessageTag(tag));
            const isHTML = translatedMessage.startsWith("!HTML!");
            // only set message if it could be retrieved, i.e. do not override HTML fallback
            if (translatedMessage !== "") {
                if (isHTML) {
                    const normalizedMessage = translatedMessage.replace(/!HTML!/, "").trimLeft();
                    elem.innerHTML = normalizedMessage;
                } else {
                    elem.textContent = translatedMessage;
                }
            }
        }

        // replace attributes
        LOCALIZED_ATTRIBUTES.forEach((currentAttribute) => {
            const currentLocaleAttribute = `${I18N_ATTRIBUTE}-${currentAttribute}`;

            if (elem.hasAttribute(currentLocaleAttribute)) {
                const attributeTag = elem.getAttribute(currentLocaleAttribute);
                const translatedMessage = browser.i18n.getMessage(getMessageTag(attributeTag));
                const isHTML = translatedMessage.startsWith("!HTML!");
                // only set message if it could be retrieved, i.e. do not override HTML fallback
                if (translatedMessage !== "") {
                    elem.setAttribute(currentAttribute, isHTML ? translatedMessage.replace(/!HTML!/, "").trimLeft() : translatedMessage);
                }
            }
        });
    }

    /**
     * Localizes static strings in the HTML file.
     *
     * @name   Localizer.init
     * @function
     * @returns {void}
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

const AddonSettings = (function () { // eslint-disable-line no-unused-vars
    const me = {};

    let gettingManagedOption;
    let gettingSyncOption;

    let managedOptions = null;
    let syncOptions = null;

    const defaultValues = Object.freeze({
        debugMode: false,
        popupIconColored: false,
        qrColor: "#0c0c0d",
        qrBackgroundColor: "#ffffff",
        qrErrorCorrection: "Q",
        monospaceFont: false,
        qrCodeSize: {
            sizeType: "fixed",
            size: 200
        }
    });

    /**
     * Get the default value.
     *
     * Returns undefined, if option cannot be found.
     *
     * @name   AddonSettings.getDefaultValue
     * @function
     * @param  {string|null} option name of the option
     * @returns {Object|undefined}
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
    };

    /**
     * Returns the add-on setting to use in add-on.
     *
     * If only a single option is requested (option=string) the result of the
     * promise will be that return value;
     *
     * @name   AddonSettings.get
     * @function
     * @param  {string|null} option name of the option
     * @returns {Promise}
     */
    me.get = async function(option) {
        let result = undefined;
        option = option || null; // null requests for all options

        await gettingManagedOption.catch(() => {
            // ignore error, as failing is expected here
        });

        // first try to get managed option
        if (managedOptions != null) {
            if (!option) {
                result = managedOptions;
            } else if (managedOptions.hasOwnProperty(option)) {
                result = managedOptions[option];
                Logger.logInfo(`Managed setting got for "${option}".`, result);
            }
        } else {
            // get synced option, otherwise
            await gettingSyncOption.catch(() => {
                // fatal error (likely already logged), requires synced options
                Promise.reject(new Error("synced options not available"));
            });

            if (syncOptions != null) {
                if (!option) {
                    result = syncOptions;
                } else if (syncOptions.hasOwnProperty(option)) {
                    result = syncOptions[option];
                    Logger.logInfo(`Synced setting got for "${option}".`, result);
                }
            }
        }

        // if result is still undefined, get default value
        if (result === undefined) {
            // get default value as a last fallback
            result = me.getDefaultValue(option);
            // last fallback: default value
            Logger.logWarning(`Could not get option "${option}". Using default.`, result);

        } else if (!option) {
            // if all values should be returned, also include all default ones in addition to fetched ones
            result = Object.assign({}, me.getDefaultValue(option), result);
        }

        return result;
    };

    /**
     * Fetches all options, so they can be used later.
     *
     * This is basically the init method!
     * It returns a promise, but that must not be used, because the module is
     * built in a way, so that the actual getting of the options is waiting for
     * the promise.
     *
     * @name   AddonSettings.loadOptions
     * @function
     * @returns {Promise}
     */
    me.loadOptions = function() {
        // just fetch everything
        gettingManagedOption = browser.storage.managed.get();
        gettingSyncOption = browser.storage.sync.get();

        gettingManagedOption.then((options) => {
            managedOptions = options;
        }).catch((error) => {
            /* only log warning as that is expected when no manifest file is found */
            Logger.logWarning("could not get managed options", error);
        });

        gettingSyncOption.then((options) => {
            syncOptions = options;
        }).catch((error) => {
            Logger.logError("could not get sync options", error);
        });

        return gettingManagedOption.then(() => {
            return gettingSyncOption;
        });
    };

    /**
     * Fetches all options, so they can be used later.
     *
     * This is basically the init method!
     *
     * @name   AddonSettings.loadOptions
     * @function
     * @returns {void}
     */
    me.loadOptions = function() {
        // just fetch everything
        gettingManagedOption = browser.storage.managed.get();
        gettingSyncOption = browser.storage.sync.get();

        gettingManagedOption.then((options) => {
            managedOptions = options;
        }).catch((error) => {
            /* only log warning as that is expected when no manifest file is found */
            Logger.logWarning("could not get managed options", error);
        });

        gettingSyncOption.then((options) => {
            syncOptions = options;
        }).catch((error) => {
            Logger.logError("could not get sync options", error);
        });
    };

    return me;
})();

const MessageHandler = (function () {// eslint-disable-line no-unused-vars
    const me = {};

    const ELEMENT_BY_TYPE = Object.freeze({
        [MESSAGE_LEVEL.ERROR]: document.getElementById("messageError"),
        [MESSAGE_LEVEL.WARN]: document.getElementById("messageWarning"),
        [MESSAGE_LEVEL.INFO]: document.getElementById("messageInfo"),
        [MESSAGE_LEVEL.SUCCESS]: document.getElementById("messageSuccess"),
        [MESSAGE_LEVEL.LOADING]: document.getElementById("messageLoading")
    });

    const hooks = {
        "global": {
            "show": null,
            "hide": null,
        },
        [MESSAGE_LEVEL.ERROR]: {
            "show": null,
            "hide": null,
        },
        [MESSAGE_LEVEL.WARN]: {
            "show": null,
            "hide": null,
        },
        [MESSAGE_LEVEL.INFO]: {
            "show": null,
            "hide": null,
        },
        [MESSAGE_LEVEL.SUCCESS]: {
            "show": null,
            "hide": null,
        },
        [MESSAGE_LEVEL.LOADING]: {
            "show": null,
            "hide": null,
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
     * @param  {Object} param the parameter to pass to the function
     * @returns {void}
     */
    function runHook(messagetype, hooktype, param) {
        // when not global itself -> to prevent infinite loop
        if (hooktype !== "global") {
            // recursively run myself for global hook first
            runHook(messagetype, "global", param);
        }

        const hook = hooks[messagetype][hooktype];
        if (hook !== null && hook !== undefined) {
            hook(param);
        }
    }

    /**
     * Dismisses (i.e. hides with animation) a message when the dismiss button is clicked.
     *
     * It automatically detects whether it is run as a trigger (click event) or
     * as the "finish event" ("transitionend") after the hiding is animated and
     * hides the message.
     *
     * @name   MessageHandler.dismissMessage
     * @function
     * @private
     * @param  {Object} event
     * @returns {void}
     */
    function dismissMessage(event) {
        // if button is just clicked triggere hiding
        if (event.type === "click") {
            const elDismissIcon = event.target;
            const elMessage = elDismissIcon.parentElement;

            // ignore event, if it is not the correct one from the message box
            if (!elMessage.classList.contains("message-box")) {
                return;
            }

            // trigger hiding
            elMessage.classList.add("fade-hide");

            // add handler to hide message completly after transition
            elMessage.addEventListener("transitionend", dismissMessage);

            Logger.logInfo("message is dismissed", event);
        } else if (event.type === "transitionend") {
            const elMessage = event.target;

            // hide message (and icon)
            hideMessage(elMessage);

            // remove set handler
            elMessage.removeEventListener("transitionend", dismissMessage);
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
     * @param {MESSAGE_LEVEL} messagetype
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    function showMessage(...args) {
        if (arguments.length < 0) {
            Logger.logError("MessageHandler.showMessage has been called without parameters");
            return;
        }

        // also log message to console
        Logger.log.apply(null, args);

        // get first element
        const messagetype = args.shift();

        // get element by message type
        const elMessage = ELEMENT_BY_TYPE[messagetype];
        if (!elMessage) {
            Logger.logError("The message could not be shown, because the DOM element is missing.", messagetype, args);
            return;
        }

        /* check value type/usage of first argument */
        let mainMessage = null;
        let isDismissable = false; // not dismissable by default

        if (typeof args[0] === "string") {
            mainMessage = args.shift();
        }
        if (typeof args[0] === "boolean") {
            isDismissable = args.shift();
        }

        // localize string or fallback to first string ignoring all others
        if (mainMessage !== null) {
            // add message to beginning of array
            args.unshift(mainMessage);

            const localizedString = browser.i18n.getMessage.apply(null, args) || mainMessage || browser.i18n.getMessage("errorShowingMessage");
            elMessage.getElementsByClassName("message-text")[0].textContent = localizedString;
        }

        const elDismissIcon = elMessage.getElementsByClassName("icon-dismiss")[0];

        if (isDismissable === true && elDismissIcon) {
            // add an icon which dismisses the message if clicked
            elDismissIcon.classList.remove("invisible");
        }

        elMessage.classList.remove("invisible");
        elMessage.classList.remove("fade-hide");
    }

    /**
     * Hides the message type(s), you specify.
     *
     * If you pass no messagetype or "null", it hides all messages.
     * If a HTMLElement is passed, it automatically hides the target of the event.
     *
     * @name   MessageHandler.hideMessage
     * @function
     * @private
     * @param  {MESSAGE_LEVEL|null|HTMLElement} messagetype
     * @returns {void}
     */
    function hideMessage(messagetype) {
        let elMessage = null;

        if (messagetype instanceof HTMLElement) {
            elMessage = messagetype;
        } else if (messagetype === null || messagetype === undefined) {
            // hide all of them
            MESSAGE_LEVEL.forEach((currentType) => {
                // recursive call myself to hide element
                me.hideMessage(currentType);
            });

            return;
        } else {
            elMessage = ELEMENT_BY_TYPE[messagetype];
        }

        // hide single message
        const elDismissIcon = elMessage.getElementsByClassName("icon-dismiss")[0];

        elMessage.classList.add("invisible");
        if (elDismissIcon) {
            elDismissIcon.classList.add("invisible");
        }

        Logger.logInfo("message is hidden", elMessage);

        return;
    }

    /**
     * Hides the error message.
     *
     * @name   MessageHandler.hideError
     * @function
     * @returns {void}
     */
    me.hideError = function() {
        runHook(MESSAGE_LEVEL.ERROR, "hide");
        hideMessage(MESSAGE_LEVEL.ERROR);
    };

    /**
     * Hide error message.
     *
     * @name   MessageHandler.hideError
     * @function
     * @returns {void}
     */
    me.hideWarning = function() {
        runHook(MESSAGE_LEVEL.WARN, "hide");
        hideMessage(MESSAGE_LEVEL.WARN);
    };

    /**
     * Hide info message.
     *
     * @name   MessageHandler.hideInfo
     * @function
     * @returns {void}
     */
    me.hideInfo = function() {
        runHook(MESSAGE_LEVEL.INFO, "hide");
        hideMessage(MESSAGE_LEVEL.INFO);
    };

    /**
     * Hide loading message.
     *
     * @name   MessageHandler.hiudeLoading
     * @function
     * @returns {void}
     */
    me.hideLoading = function() {
        runHook(MESSAGE_LEVEL.LOADING, "hide");
        hideMessage(MESSAGE_LEVEL.LOADING);
    };

    /**
     * Hide success message.
     *
     * @name   MessageHandler.hideSuccess
     * @function
     * @returns {void}
     */
    me.hideSuccess = function() {
        runHook(MESSAGE_LEVEL.SUCCESS, "hide");
        hideMessage(MESSAGE_LEVEL.SUCCESS);
    };

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
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showError = function(...args) {
        runHook(MESSAGE_LEVEL.ERROR, "show", args);

        args.unshift(MESSAGE_LEVEL.ERROR);
        showMessage(...args);
    };

    /**
     * Show an warning message.
     *
     * @name   MessageHandler.showWarning
     * @function
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showWarning = function(...args) {
        runHook(MESSAGE_LEVEL.WARN, "show", args);

        args.unshift(MESSAGE_LEVEL.WARN);
        showMessage(...args);
    };

    /**
     * Show an info message.
     *
     * @name   MessageHandler.showInfo
     * @function
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showInfo = function(...args) {
        runHook(MESSAGE_LEVEL.INFO, "show", args);

        args.unshift(MESSAGE_LEVEL.INFO);
        showMessage(...args);
    };

    /**
     * Shows a loading message.
     *
     * @name   MessageHandler.showLoading
     * @function
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showLoading = function(...args) {
        runHook(MESSAGE_LEVEL.LOADDING, "show", args);

        args.unshift(MESSAGE_LEVEL.LOADDING);
        showMessage(...args);
    };

    /**
     * Show a success message.
     *
     * @name   MessageHandler.showSuccess
     * @function
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showSuccess = function(...args) {
        runHook(MESSAGE_LEVEL.SUCCESS, "show", args);

        args.unshift(MESSAGE_LEVEL.SUCCESS);
        showMessage(...args);
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
     * @returns {void}
     */
    me.setHook = function(messagetype, hookShown, hookHidden) {
        hooks[messagetype].show = hookShown;
        hooks[messagetype].hide = hookHidden;
    };

    /**
     * Initialises the module.
     *
     * @name   MessageHandler.init
     * @function
     * @returns {void}
     */
    me.init = function() {
        /* add event listeners */
        const dismissIcons = document.getElementsByClassName("icon-dismiss");

        for (const elDismissIcon of dismissIcons) {
            // hide message when dismiss button is clicked
            elDismissIcon.addEventListener("click", dismissMessage);
        }
    };

    return me;
})();

// init modules
AddonSettings.loadOptions();
Logger.init();
MessageHandler.init();
Localizer.init();
