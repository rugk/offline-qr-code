"use strict";

/**
 * Specifies the long name of this add-on.,
 *
 * @readonly
 * @type {string}
 * @default
 */
const ADDON_NAME = "Offline QR code generator"; // eslint-disable-line no-unused-vars

/**
 * Specifies the short name of this add-on.,
 *
 * @readonly
 * @type {string}
 * @default
 */
const ADDON_NAME_SHORT = "Offline QR code";

/**
 * Specifies the message level to use,
 *
 * @readonly
 * @enum {int}
 * @default
 */
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
        // NOTE: The effect of this is, taht when the settings are not yet
        // loaded, we always log all messages. However, we also cannot wait/delay
        // loading these in some asyncronous way as log messages are time-critical
        // and must be in the correct order to be useful output.
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
                    const normalizedMessage = translatedMessage.replace("!HTML!", "").trimLeft();
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
                    elem.setAttribute(currentAttribute, isHTML ? translatedMessage.replace("!HTML!", "").trimLeft() : translatedMessage);
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
        document.querySelector("html").setAttribute("lang", browser.i18n.getUILanguage());
    };

    return me;
})();

const AddonSettings = (function () { // eslint-disable-line no-unused-vars
    const me = {};

    // lodash
    /* globals isObject */

    let gettingManagedOption;
    let gettingSyncOption;

    let managedOptions = null;
    let syncOptions = null;

    const defaultValues = Object.freeze({
        debugMode: false,
        popupIconColored: false,
        qrCodeType: "svg",
        qrColor: "#0c0c0d",
        qrBackgroundColor: "#ffffff",
        qrErrorCorrection: "Q",
        monospaceFont: false,
        qrCodeSize: {
            sizeType: "fixed",
            size: 200
        },
        randomTips: {
            tips: {}
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
     * Sets the settings.
     *
     * Note you can pass an key -> value object to set here.
     *
     * @name   AddonSettings.set
     * @see {@link https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/StorageArea/set}
     * @function
     * @param  {Object|string} option keys/values to set or single value
     * @param  {Object} value if only a single value is to be set
     * @returns {Promise}
     */
    me.set = function(option, value) {
        // put params into object if needed
        if (!isObject(option)) {
            option = {
                [option]: value
            };
        }

        return browser.storage.sync.set(option).catch((error) => {
            Logger.logError("Could not save option:", option, error);
        });
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
            "dismissStart": null,
            "dismissEnd": null,
            "actionButton": null
        },
        [MESSAGE_LEVEL.ERROR]: {
            "show": null,
            "hide": null,
            "actionButton": null
        },
        [MESSAGE_LEVEL.WARN]: {
            "show": null,
            "hide": null,
            "actionButton": null
        },
        [MESSAGE_LEVEL.INFO]: {
            "show": null,
            "hide": null,
            "actionButton": null
        },
        [MESSAGE_LEVEL.SUCCESS]: {
            "show": null,
            "hide": null,
            "actionButton": null
        },
        [MESSAGE_LEVEL.LOADING]: {
            "show": null,
            "hide": null,
            "actionButton": null
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

            runHook("global", "dismissStart", {
                elMessage,
                event
            });

            Logger.logInfo("message is dismissed", event);
        } else if (event.type === "transitionend") {
            const elMessage = event.target;

            // hide message (and icon)
            me.hideMessage(elMessage);

            runHook("global", "dismissEnd", {
                elMessage,
                event
            });

            // remove set handler
            elMessage.removeEventListener("transitionend", dismissMessage);
        }
    }

    /**
     * The action button event handler, when clicked.
     *
     * @name   MessageHandler.getMessageTypeFromElement
     * @function
     * @private
     * @param  {HTMLElement} elMessage
     * @returns {MESSAGE_LEVEL|HTMLElement}
     */
    function getMessageTypeFromElement(elMessage) {
        const messagetype = Object.keys(ELEMENT_BY_TYPE).find((messagetype) => {
            // skip, if element does not exist
            if (!ELEMENT_BY_TYPE[messagetype]) {
                return false;
            }

            return ELEMENT_BY_TYPE[messagetype].isEqualNode(elMessage);
        });

        if (messagetype === undefined) {
            // verify it is a real message box
            if (!elMessage.classList.contains("message-box")) {
                throw new Error(`message element ${elMessage} is no real message box`);
            }

            // if it is a custom element, return it unmodified
            return elMessage;
        }

        return messagetype;
    }

    /**
     * The action button event handler, when clicked.
     *
     * @name   MessageHandler.actionButtonClicked
     * @function
     * @private
     * @param  {Object} event
     * @returns {void}
     */
    function actionButtonClicked(event) {
        const elActionButton = event.target;
        const elActionButtonLink = elActionButton.parentNode;
        const elMessage = elActionButtonLink.parentNode;

        const messagetype = getMessageTypeFromElement(elMessage);

        Logger.logInfo("action button clicked for ", messagetype, event);

        runHook(messagetype, "actionButton", {
            elMessage,
            messagetype,
            event
        });
    }

    /**
     * Shows a message to the user.
     *
     * Pass as many strings/output as you want. They will be localized
     * automatically, before presented to the user.
     *
     * If you pass a HTMLElement as the first parameter, you can use your own
     * custom node for the message.
     *
     * @name   MessageHandler.showMessage
     * @function
     * @param {MESSAGE_LEVEL|HTMLElement} messagetype
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {Object} actionButton optional to show an action button
     * @param {string} actionButton.text
     * @param {string|function} actionButton.action URL to site to open on link OR function to execute
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showMessage = function(...args) {
        if (arguments.length < 0) {
            Logger.logError("MessageHandler.showMessage has been called without parameters");
            return;
        }

        let elMessage = null;

        // also log message to console
        if (args[0] instanceof HTMLElement) {
            Logger.logInfo.apply(null, args);
        } else {
            Logger.log.apply(null, args);
        }

        // get first element
        const messagetype = args.shift();

        if (messagetype in ELEMENT_BY_TYPE) {
            elMessage = ELEMENT_BY_TYPE[messagetype];
        } else {
            elMessage = messagetype;
        }

        // and stuuf inside we need later
        const elDismissIcon = elMessage.getElementsByClassName("icon-dismiss")[0];
        const elActionButton = elMessage.getElementsByClassName("message-action-button")[0];
        let elActionButtonLink = null;
        if (elActionButton) {
            elActionButtonLink = elActionButton.parentNode;
        }

        // a custom element also needs the custom listeners to be set
        if (messagetype instanceof HTMLElement) {
            elDismissIcon.addEventListener("click", dismissMessage);
            elActionButtonLink.addEventListener("click", actionButtonClicked);
        }

        if (!elMessage) {
            Logger.logError("The message could not be shown, because the DOM element is missing.", messagetype, args);
            return;
        }

        /* check value type/usage of first argument */
        let mainMessage = null;
        let isDismissable = false; // not dismissable by default
        let actionButton = null; // no action button by default

        if (typeof args[0] === "string") {
            mainMessage = args.shift();
        }
        if (typeof args[0] === "boolean") {
            isDismissable = args.shift();
        }
        if (args[0] !== undefined && args[0].text !== undefined && args[0].action !== undefined) {
            actionButton = args.shift();
        }

        // localize string or fallback to first string ignoring all others
        if (mainMessage !== null) {
            // add message to beginning of array
            args.unshift(mainMessage);

            const localizedString = browser.i18n.getMessage.apply(null, args) || mainMessage || browser.i18n.getMessage("errorShowingMessage");
            elMessage.getElementsByClassName("message-text")[0].textContent = localizedString;
        }

        if (isDismissable === true && elDismissIcon) {
            // add an icon which dismisses the message if clicked
            elDismissIcon.classList.remove("invisible");
        } else if (elDismissIcon) {
            elDismissIcon.classList.add("invisible");
        }

        // show action button, if needed
        if (actionButton !== null && elActionButton && elActionButtonLink) {
            // see lodash -> isFunction //TODO: refactor to use it here
            if (isObject(actionButton.action) && typeof actionButton.action === "function") {
                // save option to be called later
                hooks[messagetype].actionButton = actionButton.action;

                // potentiall remove previous set thing
                elActionButtonLink.removeAttribute("href");
            } else {
                elActionButtonLink.setAttribute("href", actionButton.link);

                // unset potential previously set handler
                hooks[messagetype].actionButton = null;
            }

            elActionButton.textContent = browser.i18n.getMessage(actionButton.text) || actionButton.text;
            elActionButton.classList.remove("invisible");
        } else if (elActionButton) {
            elActionButton.classList.add("invisible");
        }

        elMessage.classList.remove("invisible");
        elMessage.classList.remove("fade-hide");
    };

    /**
     * Hides the message type(s), you specify.
     *
     * If you pass no messagetype or "null", it hides all messages.
     * If a HTMLElement is passed, it automatically hides the target of the event.
     *
     * @name   MessageHandler.hideMessage
     * @function
     * @param  {MESSAGE_LEVEL|null|HTMLElement} messagetype
     * @returns {void}
     */
    me.hideMessage = function(messagetype) {
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
    };

    /**
     * Hides the error message.
     *
     * @name   MessageHandler.hideError
     * @function
     * @returns {void}
     */
    me.hideError = function() {
        runHook(MESSAGE_LEVEL.ERROR, "hide");
        me.hideMessage(MESSAGE_LEVEL.ERROR);
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
        me.hideMessage(MESSAGE_LEVEL.WARN);
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
        me.hideMessage(MESSAGE_LEVEL.INFO);
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
        me.hideMessage(MESSAGE_LEVEL.LOADING);
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
        me.hideMessage(MESSAGE_LEVEL.SUCCESS);
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
     * @param {Object} actionButton optional to show an action button
     * @param {string} actionButton.text
     * @param {string|function} actionButton.action URL to site to open on link OR function to execute
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showError = function(...args) {
        runHook(MESSAGE_LEVEL.ERROR, "show", args);

        args.unshift(MESSAGE_LEVEL.ERROR);
        me.showMessage(...args);
    };

    /**
     * Show an warning message.
     *
     * @name   MessageHandler.showWarning
     * @function
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {Object} actionButton optional to show an action button
     * @param {string} actionButton.text
     * @param {string|function} actionButton.action URL to site to open on link OR function to execute
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showWarning = function(...args) {
        runHook(MESSAGE_LEVEL.WARN, "show", args);

        args.unshift(MESSAGE_LEVEL.WARN);
        me.showMessage(...args);
    };

    /**
     * Show an info message.
     *
     * @name   MessageHandler.showInfo
     * @function
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {Object} actionButton optional to show an action button
     * @param {string} actionButton.text
     * @param {string} actionButton.link URL to site to open on link
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showInfo = function(...args) {
        runHook(MESSAGE_LEVEL.INFO, "show", args);

        args.unshift(MESSAGE_LEVEL.INFO);
        me.showMessage(...args);
    };

    /**
     * Shows a loading message.
     *
     * @name   MessageHandler.showLoading
     * @function
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {Object} actionButton optional to show an action button
     * @param {string} actionButton.text
     * @param {string|function} actionButton.action URL to site to open on link OR function to execute
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showLoading = function(...args) {
        runHook(MESSAGE_LEVEL.LOADDING, "show", args);

        args.unshift(MESSAGE_LEVEL.LOADDING);
        me.showMessage(...args);
    };

    /**
     * Show a success message.
     *
     * @name   MessageHandler.showSuccess
     * @function
     * @param {string} message optional, string to show or to translate if omitted no new text is shown
     * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
     * @param {Object} actionButton optional to show an action button
     * @param {string} actionButton.text
     * @param {string|function} actionButton.action URL to site to open on link OR function to execute
     * @param {...*} args optional parameters for translation
     * @returns {void}
     */
    me.showSuccess = function(...args) {
        runHook(MESSAGE_LEVEL.SUCCESS, "show", args);

        args.unshift(MESSAGE_LEVEL.SUCCESS);
        me.showMessage(...args);
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
     * @name   MessageHandler.setHook
     * @function
     * @param  {MESSAGE_LEVEL|HtmlElement} messagetype use string "global" for a global hook
     * @param {function|null} hookShown
     * @param {function|null} hookHidden
     * @returns {void}
     */
    me.setHook = function(messagetype, hookShown, hookHidden) {
        hooks[messagetype].show = hookShown;
        hooks[messagetype].hide = hookHidden;
    };

    /**
     * Called when a message is dismissed.
     *
     + When called, the function does not know, which message is hidden, but you
     * can determinante it by yourself.
     * The called hook gets an object with two parameters:
     * - {HTMLElement} elMessage – the message element, which was hidden
     * - {event} event – the original click even on the dismiss button
     *
     * @name   MessageHandler.setDismissHooks
     * @function
     * @param {function|null} startHook
     * @param {function|null} endHook
     * @returns {void}
     */
    me.setDismissHooks = function(startHook, endHook) {
        hooks.global.dismissStart = startHook;
        hooks.global.dismissEnd = endHook;
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

        const actionButtons = document.getElementsByClassName("message-action-button");

        for (const elActionButton of actionButtons) {
            const elActionButtonLink = elActionButton.parentElement;
            elActionButtonLink.addEventListener("click", actionButtonClicked);
        }
    };

    return me;
})();

const RandomTips = (function () {// eslint-disable-line no-unused-vars
    const me = {};

    /* globals debounce */

    const TIP_SETTING_STORAGE_ID = "randomTips";
    const GLOBAL_RANDOMIZE = 0.2; // %
    const DEBOUNCE_SAVING = 1000; // ms

    const elMessageBox = document.getElementById("messageTips");

    /**
     * The list of all tips.
     *
     * Format:
     * {
     *     id {string} – just some ID
     *     maxShowCount {integer} – shows the message at most x times
     *     allowDismiss {bool} – optional, Set to false to disallow dismissing
     *          the message. This likely makes no sense for any tip, so the
     *          default is true.
     *     requireDismiss {bool|integer} – optional, require that message is
     *          dismissed to count as a maxShowCount. True enables this,
     *          with any integer you can specify a lower value to only require
     *          x dismisses.
     *     requiredTriggers {integer} – optional, require some displays
     *          ("triggers") of shows of tip ebfore showing tip. This is
     *          effectively just a minimum limit, so it is not shown too "early",
     *          default: 10
     *     showInContext {bool|} – optional, a key-value object with context -> num
     *          to require the tip to be shown in a specific context for the given
     *          number of times.
     *     randomizeDisplay {bool|integer} – optional, Randomizes the display
     *          with a chance of 50% by default (when "true" is set). You can
     *          override that percentage (as an integer, e.g. 0.2 instead of 20%).
     *          Note that the tip message display in general is already randomized
     *          with a chance of 20%, see {@link GLOBAL_RANDOMIZE}.
     *     text {string}: The text to actually show. It is passed to the
     *          {@link MessageHandler}, so you can (& should) use a translatable
     *          string here.
     *     actionButton {Object} – optional, adds an action button to the message
     * }
     *
     * @type {Object[]}
     */
    const tips = [
        {
            id: "likeAddon",
            maxShowCount: 3,
            requireDismiss: 1,
            requiredTriggers: 10,
            showInContext: {
                "popup": 1
            },
            randomizeDisplay: false,
            text: "tipYouLikeAddon",
            actionButton: {
                text: "tipYouLikeAddonButton",
                action: "https://addons.mozilla.org/firefox/addon/offline-qr-code-generator/reviews/"
            }
        },
        {
            id: "saveQr",
            maxShowCount: 5,
            requireDismiss: 1,
            requiredTriggers: 5,
            showInContext: {
                "popup": 1
            },
            randomizeDisplay: false,
            text: "tipSaveQrCode",
            actionButton: {
                text: "tipLearnMore",
                action: "https://github.com/rugk/offline-qr-code/wiki/FAQ#how-to-save-the-qr-code-on-disk"
            }
        }
    ];

    let tipConfig = {
        tips: {}
    };

    let tipShown = null;
    let context = null;

    /**
     * Save the current config.
     *
     * @name   RandomTips.saveConfig
     * @function
     * @private
     * @returns {void}
     */
    const saveConfig = debounce(() => {
        AddonSettings.set(TIP_SETTING_STORAGE_ID, tipConfig);
    }, DEBOUNCE_SAVING);

    /**
     * Hook for the dismiss event.
     *
     * @name   RandomTips.messageDismissed
     * @function
     * @private
     * @param  {Object} param
     * @returns {void}
     */
    function messageDismissed(param) {
        const elMessage = param.elMessage;

        // ignore other dismissed messages
        if (elMessage !== elMessageBox) {
            return;
        }

        const id = elMessageBox.dataset.tipId;
        if (tipShown.id !== id) {
            throw new Error("cached tip and dismissed tip differ");
        }

        // update config
        tipConfig.tips[id].dismissedCount = (tipConfig.tips[id].dismissedCount || 0) + 1;
        saveConfig();

        // remove dismiss hook
        MessageHandler.setDismissHooks(null);

        // cleanup values
        tipShown = null;
        delete elMessageBox.dataset.tipId;

        Logger.logInfo(`Tip ${id} has been dismissed.`);
    }

    /**
     * Returns true or false at random. The passed procentage indicates how
     * much of the calls should return "true" on average.
     *
     * @name   RandomTips.randomizePassed
     * @function
     * @private
     * @param  {number} percentage
     * @returns {bool}
     */
    function randomizePassed(percentage) {
        return (Math.random() < percentage);
    }

    /**
     * Shows this tip.
     *
     * @name   RandomTips.showTip
     * @function
     * @private
     * @param  {Object} tipSpec
     * @returns {void}
     */
    function showTip(tipSpec) {
        // default settings
        const allowDismiss = tips.tipSpec !== undefined ? tips.tipSpec : true;

        elMessageBox.dataset.tipId = tipSpec.id;
        MessageHandler.showMessage(elMessageBox, tipSpec.text, allowDismiss, tipSpec.actionButton);

        // hook dismiss
        MessageHandler.setDismissHooks(messageDismissed);

        // update config
        tipConfig.tips[tipSpec.id].shownCount = (tipConfig.tips[tipSpec.id].shownCount || 0) + 1;
        tipConfig.tips[tipSpec.id].shownContext[context] = (tipConfig.tips[tipSpec.id].shownContext[context] || 0) + 1;
        saveConfig();

        tipShown = tipSpec;
    }

    /**
     * Returns whether the tip has already be shown enough times or may not
     * be shown, because of some other requirement.
     *
     * @name   RandomTips.shouldBeShown
     * @function
     * @private
     * @param  {Object} tipSpec
     * @returns {bool}
     */
    function shouldBeShown(tipSpec) {
        // default settings
        tipSpec.requiredTriggers = tipSpec.requiredTriggers !== undefined ? tipSpec.requiredTriggers : 10;
        tipSpec.maxShowCount = tipSpec.maxShowCount !== undefined ? tipSpec.maxShowCount : 0;

        // create option if needed
        if (tipConfig.tips[tipSpec.id] === undefined) {
            tipConfig.tips[tipSpec.id] = {};
            tipConfig.tips[tipSpec.id].shownContext = {};
            saveConfig();
        }

        // require some global triggers, if needed
        if (tipConfig.triggeredOpen < tipSpec.requiredTriggers) {
            return false;
        }
        // require some additional randomness if needed
        if (tipSpec.randomizeDisplay) {
            // default value for tip is 50%
            tipSpec.randomizeDisplay = tipSpec.randomizeDisplay !== true ? tipSpec.randomizeDisplay : 0.5;

            // 1 : x -> if one number is not selected, do not display result
            if (!randomizePassed(tipSpec.randomizeDisplay)) {
                return false;
            }
        }

        // or has it been shown enough times already?

        // dismiss is shown enough times?
        let requiredDismissCount;
        if (Number.isFinite(tipSpec.requireDismiss)) {
            requiredDismissCount = tipSpec.requireDismiss;
        } else if (tipSpec.requireDismiss === true) { // bool
            requiredDismissCount = tipSpec.maxShowCount;
        } else {
            requiredDismissCount = 0;
        }

        // check context check if needed
        if (context in tipSpec.showInContext) {
            const tipShownInCurrentContext = tipConfig.tips[tipSpec.id].shownContext[context] || 0;

            if (tipShownInCurrentContext < tipSpec.showInContext[context]) {
                return true;
            }
        }

        const tipShowCount = tipConfig.tips[tipSpec.id].shownCount || 0;
        const tipDismissed = tipConfig.tips[tipSpec.id].dismissedCount || 0;

        return tipShowCount < tipSpec.maxShowCount // not already shown enough times already?
            || tipDismissed < requiredDismissCount; // not dismissed enough times?
    }

    /**
     * Sets the context for the current session.
     *
     * @name   RandomTips.setContext
     * @function
     * @param {string} string
     * @returns {void}
     */
    me.setContext = function(string) {
        context = string;
    };

    /**
     * Selects and shows a random tip.
     *
     * @name   RandomTips.showRandomTip
     * @function
     * @returns {void}
     */
    me.showRandomTip = function() {
        // only try to select tip, if one is even available
        if (tips.length === 0) {
            Logger.logInfo("no tips to show available anymore");
            return;
        }

        // randomly select element
        const randomNumber = Math.floor(Math.random() * tips.length);
        const tipSpec = tips[randomNumber];

        if (!shouldBeShown(tipSpec)) {
            // remove tip
            tips.splice(randomNumber);

            // retry random selection
            me.showRandomTip();
            return;
        }

        Logger.logInfo("selected tip to be shown:", randomNumber, tipSpec);

        showTip(tipSpec);
    };

    /**
     * Shows the random tip only randomly so the user is not annoyed.
     *
     * @name   RandomTips.showRandomTipIfWanted
     * @function
     * @returns {void}
     */
    me.showRandomTipIfWanted = function() {
        tipConfig.triggeredOpen = (tipConfig.triggeredOpen || 0) + 1;
        saveConfig();

        // randomize tip showing in general
        if (!randomizePassed(GLOBAL_RANDOMIZE)) {
            Logger.logInfo("show no random tip, because randomize did not pass");
            return;
        }

        me.showRandomTip();
    };

    /**
     * Initialises the module.
     *
     * @name   RandomTips.init
     * @function
     * @returns {Promise}
     */
    me.init = function() {
        return AddonSettings.get(TIP_SETTING_STORAGE_ID).then((randomTips) => {
            tipConfig = randomTips;
        });
    };

    return me;
})();

const Colors = (() => { // eslint-disable-line no-unused-vars
    const me = {};

    /**
     * Calculates the contrast between two colors
     *
     * @name   Colors.contrastRatio
     * @function
     * @param  {Array} rgb1
     * @param  {Array} rgb2
     * @returns {int}
     */
    me.contrastRatio = function(rgb1, rgb2) {
        const l1 = luminance(rgb1);
        const l2 = luminance(rgb2);
        // Formula: https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    /**
     * Calculates the luminance of a given RGB color.
     *
     * @name   Colors.luminance
     * @function
     * @private
     * @param  {Array} rgb
     * @returns {Array|null}
     */
    function luminance(rgb) {
        // Formula: https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
        let r = rgb[0] / 255;
        let g = rgb[1] / 255;
        let b = rgb[2] / 255;
        // Note: I'm using 0.04045 here (instead of 0.03928) because 0.04045 is the
        // number used in the actual sRGB standard.
        // See also: https://github.com/w3c/wcag21/issues/815
        r = r < 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        g = g < 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        b = b < 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Returns the complementary color of a given RGB array.
     *
     * @name   Colors.invertColor
     * @function
     * @param  {Array} rgb
     * @returns {string}
     */
    me.invertColor = function(rgb) {
        // invert color components
        const r = (255 - rgb[0]).toString(16);
        const g = (255 - rgb[1]).toString(16);
        const b = (255 - rgb[2]).toString(16);
        // pad each with zeros and return
        return `#${padZero(r)}${padZero(g)}${padZero(b)}`;
    };

    /**
     * Adds missing zeros in front of a string.
     *
     * @name   Colors.padZero
     * @function
     * @private
     * @param  {string} string
     * @param  {int} length
     * @returns {string}
     */
    function padZero(string, length) {
        length = length || 2;
        const zeros = new Array(length).join("0");
        return (zeros + string).slice(-length);
    }

    /**
     * Converts a hex color string to RGB.
     *
     * @name   Colors.hexToRgb
     * @function
     * @param  {string} hex
     * @returns {Array|null}
     */
    me.hexToRgb = function(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ];
        }
        return null;
    };

    return me;
})();

// init modules
AddonSettings.loadOptions();
Logger.init();
MessageHandler.init();
Localizer.init();
