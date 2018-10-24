/**
 * Shows and hides messages to the user.
 *
 * @module /common/modules/MessageHandler
 * @requires /common/modules/lib/lodash/isFunction
 * @requires /common/modules/data/MessageLevel
 * @requires /common/modules/Logger
 */

// lodash
import isFunction from "/common/modules/lib/lodash/isFunction.js";

import * as Logger from "/common/modules/Logger.js";

const HOOK_TEMPLATE = {
    show: null,
    hide: null,
};
const HOOK_TEMPLATE_DISMISS = {
    dismissStart: null,
    dismissEnd: null,
};
const HOOK_TEMPLATE_ACTION_BUTTON = {
    actionButton: null
};

let globalHooks = Object.assign({}, HOOK_TEMPLATE, HOOK_TEMPLATE_DISMISS, HOOK_TEMPLATE_ACTION_BUTTON);  /* eslint-disable-line */
let hooks = {};

let htmlElements = {};
let designClasses = {};


/**
 * Runs a hook set by some module.
 *
 * It automatically also runs the global hook.
 *
 * @function
 * @private
 * @param  {string} hooktype the type you want to call
 * @param  {Object} param the parameter to pass to the function
 * @returns {void}
 */
function runGlobalHook(hooktype, param) {
    const hook = globalHooks[hooktype];
    if (hook !== null) {
        hook(param);
    }
}

/**
 * Runs a hook set by some module.
 *
 * It automatically also runs the global hook.
 *
 * @function
 * @private
 * @param  {MESSAGE_LEVEL} messageType
 * @param  {string} hooktype the type you want to call
 * @param  {Object} param the parameter to pass to the function
 * @returns {void}
 */
function runHook(messageType, hooktype, param) {
    runGlobalHook(hooktype, param);

    if (messageType instanceof HTMLElement) {
        return; // TODO: handle error
    }

    const hook = hooks[messageType][hooktype];
    if (hook !== null) {
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

        runGlobalHook("dismissStart", {
            elMessage,
            event
        });

        Logger.logInfo("message is dismissed", event);
    } else if (event.type === "transitionend") {
        const elMessage = event.target;

        // ignore event, if it is not the correct one from the message box
        if (!elMessage.classList.contains("message-box")) {
            return;
        }

        // hide message (and icon)
        hideMessage(elMessage);

        runGlobalHook("dismissEnd", {
            elMessage,
            event
        });

        // remove set handler
        elMessage.removeEventListener("transitionend", dismissMessage);
    }
}

/**
 * Returns the message type (ID) of a custom message.
 *
 * @function
 * @private
 * @param  {HTMLElement} elMessage
 * @returns {string}
 * @throws {Error}
 */
function getCustommessageType(elMessage) {
    // verify it is a real message box
    if (!elMessage.classList.contains("message-box")) {
        throw new Error(`message element ${elMessage} is no real message box`);
    }

    // use ID of element as message type
    return elMessage.id;
}

/**
 * Returns the message type based on the passed element.
 *
 * @function
 * @private
 * @param  {HTMLElement} elMessage
 * @returns {MESSAGE_LEVEL|HTMLElement}
 * @throws {Error}
 */
function getMessageTypeFromElement(elMessage) {
    let messageType = Object.keys(htmlElements).find((messageType) => {
        // skip, if element does not exist
        if (!htmlElements[messageType]) {
            return false;
        }

        return htmlElements[messageType].isEqualNode(elMessage);
    });

    if (messageType === undefined) {
        // this throws if it is no real (custom) message
        messageType = getCustommessageType(elMessage);
    }

    return messageType;
}

/**
 * Returns the HTMLElement based on the passed message type.
 *
 * It supports custom elements, i.e. when the element itself is already passed.
 * Because of that, it returns both the message type back as a string and the
 * HTMLElement.
 * As an addition it returns a boolean as the last variable, which is true
 * when the element is a custom message.
 * Note that it does not verify whether the DOM element actualyl exists.
 *
 * @function
 * @private
 * @param {MESSAGE_LEVEL|HTMLElement} messageType
 * @returns {Array.<string, HTMLElement>}
 * @throws {Error}
 */
function getElementFromMessageType(messageType) {
    let elMessage;

    if (messageType instanceof HTMLElement) {
        // handle custom messages first
        elMessage = messageType;

        messageType = getCustommessageType(elMessage);
    } else if (messageType in htmlElements) {
        // verify string message types are valid
        elMessage = htmlElements[messageType];

        if (elMessage === null) {
            throw new Error(`message type ${messageType} has no corresponding HTMLElement`);
        }
    } else {
        // TODO: use new verify
        throw new Error(`message type ${messageType} is/belong to an unknown element`);
    }

    return [messageType, elMessage];
}

/**
 * The action button event handler, when clicked.
 *
 * @function
 * @private
 * @param  {Object} event
 * @returns {void}
 */
function actionButtonClicked(event) {
    const elActionButtonLink = event.currentTarget;
    const elMessage = elActionButtonLink.parentNode;

    const messageType = getMessageTypeFromElement(elMessage);

    Logger.logInfo("action button clicked for ", messageType, event);

    runHook(messageType, "actionButton", {
        elMessage,
        messageType,
        event
    });
}

/**
 * Returns the design this message resembles.
 *
 * Please DO NOT use this with the built-in message elements.
 *
 * @function
 * @param  {HTMLElement} elMessage
 * @param  {MESSAGE_LEVEL} newDesignType
 * @returns {void}
 */
export function setMessageDesign(elMessage, newDesignType) {
    const newDesign = designClasses[newDesignType];
    const elActionButton = elMessage.getElementsByClassName("message-action-button")[0];

    // set new design
    elMessage.classList.add(newDesign);
    elActionButton.classList.add(newDesign);

    // unset old design
    Object.values(designClasses).forEach((oldDesign) => {
        /// do not remove newly set design
        if (oldDesign === newDesign) {
            return;
        }

        elMessage.classList.remove(oldDesign);
        elActionButton.classList.remove(oldDesign);
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
 * Attention: This is a "low-level function" and does thus not run the show hook!
 *
 * @function
 * @param {MESSAGE_LEVEL|HTMLElement} messageType
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object|null} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showMessage(...args) {
    if (args.length == 0) {
        Logger.logError("showMessage has been called without parameters");
        return;
    }

    // also log message to console
    if (args[0] instanceof HTMLElement) {
        Logger.logInfo(...args);
    } else {
        Logger.log(...args);
    }

    // get first element
    const [messageType, elMessage] = getElementFromMessageType(args.shift());

    // and stuff inside we need later
    const elDismissIcon = elMessage.getElementsByClassName("icon-dismiss")[0];
    const elActionButton = elMessage.getElementsByClassName("message-action-button")[0];
    let elActionButtonLink = null;
    if (elActionButton) {
        elActionButtonLink = elActionButton.parentNode;
    }

    if (!elMessage) {
        Logger.logError("The message could not be shown, because the DOM element is missing.", messageType, args);
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
    if (args[0] && args[0].text && args[0].action) {
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
        if (isFunction(actionButton.action)) {
            // save option to be called later
            hooks[messageType].actionButton = actionButton.action;

            // potentiall remove previous set thing
            elActionButtonLink.removeAttribute("href");
        } else {
            elActionButtonLink.setAttribute("href", actionButton.action);

            // unset potential previously set handler
            hooks[messageType].actionButton = null;
        }

        elActionButton.textContent = browser.i18n.getMessage(actionButton.text) || actionButton.text;
        elActionButton.classList.remove("invisible");
    } else if (elActionButton) {
        elActionButton.classList.add("invisible");
    }

    elMessage.classList.remove("invisible");
    elMessage.classList.remove("fade-hide");

    // run hook
    // TODO: gets message type first, that is wrong!
    runHook(messageType, "show", args);
}

/**
 * Hides the message type(s), you specify.
 *
 * If you pass no messageType or "null", it hides all messages. (except custom ones)
 * If a HTMLElement is passed, it automatically hides the target of the event.
 * Attention: This is a "low-level function" and does thus not run the hide hook!
 *
 * @function
 * @param  {MESSAGE_LEVEL|null|HTMLElement} [messageType]
 * @returns {void}
 */
export function hideMessage(messageType = null) {
    // hide all messages if type is not specified
    if (messageType === null) {
        // hide all of them
        for (const currentType of Object.keys(htmlElements)) {
            // recursive call myself to hide element
            hideMessage(currentType);
        }

        return;
    }

    const [, elMessage] = getElementFromMessageType(messageType);
    // hide single message
    const elDismissIcon = elMessage.getElementsByClassName("icon-dismiss")[0];

    elMessage.classList.add("invisible");
    if (elDismissIcon) {
        elDismissIcon.classList.add("invisible");
    }

    Logger.logInfo("message is hidden", elMessage);

    // run hook
    runHook(messageType, "hide");

    return;
}

/**
 * Clones a message HTMLElement you specify.
 *
 * It sorts the message directly after the message you clone.
 * The message is hidden by default – regardless of the state of the origin
 * message (type).
 *
 * CURRENTLY UNUSED.
 *
 * @function
 * @param  {MESSAGE_LEVEL|HTMLElement} messageType
 * @param  {string} newId New ID to use for that element
 * @returns {HTMLElement}
 */
export function cloneMessage(messageType, newId) {
    let elMessage = null;

    [messageType, elMessage] = getElementFromMessageType(messageType);

    // clone message
    const clonedElMessage = elMessage.cloneNode(elMessage);
    clonedElMessage.id = newId;

    // hide the message to reset it if needed
    hideMessage(clonedElMessage);

    // attach to DOM
    elMessage.insertAdjacentElement("afterend", clonedElMessage);

    return clonedElMessage;
}

/**
 * Returns whether the message type is already registred.
 *
 * @private
 * @param  {string} messageType
 * @returns {boolean}
 */
function ismessageTypeRegistered(messageType) {
    return messageType in htmlElements;
}

/**
 * Verifies that the message type is alreayd registered.
 *
 * It throws, if it is not.
 *
 * @private
 * @param  {string} messageType
 * @returns {void}
 * @throws
 */
function verifyMessageType(messageType) {
    if (!ismessageTypeRegistered(messageType)) {
        throw new Error(`Unregistered message type ${messageType} passed.`);
    }
}

/**
 * Registers a new message type.
 *
 * @function
 * @param  {int|string} messageType
 * @param  {HTMLElement} elMessage element to register with it
 * @param  {string} [designClass] the class to apply
 * @returns {void}
 * @throws {Error}
 */
export function registerMessageType(messageType, elMessage, designClass) {
    if (ismessageTypeRegistered(messageType)) {
        throw new Error(`Message type ${messageType} is already registered. Cannot register again.`);
    }

    // TODO: verify it's not already regsitered

    // save HTMLElement
    htmlElements[messageType] = elMessage;

    // set empty hook
    const newHook = HOOK_TEMPLATE;

    // optionally set design type
    if (designClass) {
        designClasses[messageType] = designClass;
    }

    // add event listener
    const dismissIcon = elMessage.getElementsByClassName("icon-dismiss");
    const actionButton = elMessage.getElementsByClassName("message-action-button");

    // add properties/hook types only if possible
    if (dismissIcon.length > 0) {
        dismissIcon[0].addEventListener("click", dismissMessage);

        Object.assign(newHook, HOOK_TEMPLATE_DISMISS);
    }

    if (actionButton.length > 0) {
        actionButton[0].parentElement // to bind to link element and not to button
            .addEventListener("click", actionButtonClicked);

        Object.assign(newHook, HOOK_TEMPLATE_ACTION_BUTTON);
    }

    hooks[messageType] = newHook;
}

/**
 * Verifies that a hook is valid.
 *
 * @private
 * @param {string} hookType
 * @param {function|null} hookFunction the callback to run
 * @returns {void}
 * @throws {TypeError|Error} if invalid hook type is used
 */
function verifyHook(hookType, hookFunction) {
    if (!(hookType in HOOK_TEMPLATE)) {
        throw new TypeError(`Hook type "${hookType}" is not unknown.`);
    }

    // verify function
    if (!isFunction(hookFunction) && hookFunction !== null) {
        throw new TypeError(`Hook function "${hookFunction}" is not a valid data type. It must be a function or "null".`);
    }
}

/**
 * Let's other functions set a hook to be called when a message type is
 * shown or hidden.
 *
 * Set parameters to null or undefined (i.e. do not set) in order to disable
 * the hook.
 * The errorShown function gets one parameter: The arguments passed to the
 * function, as an array.
 *
 * Pass "null" to it to unset it.
 *
 * @public
 * @param  {MESSAGE_LEVEL|HtmlElement} messageType
 * @param {string} hookType
 * @param {function|null} hookFunction the callback to run
 * @returns {void}
 * @throws {TypeError|Error} if invalid hook type is used
 */
export function setHook(messageType, hookType, hookFunction) {
    verifyMessageType(messageType);
    verifyHook(hookType, hookFunction);

    if (!(hookType in hooks[messageType])) {
        throw new Error(`Hook type "${hookType}" is not valid for this message type.`);
    }

    hooks[messageType][hookType] = hookFunction;
}


/**
 * Resets whole module and thus unregisters all messages.
 *
 * @function
 * @returns {void}
 */
export function reset() {
    globalHooks = Object.assign({}, HOOK_TEMPLATE, HOOK_TEMPLATE_DISMISS, HOOK_TEMPLATE_ACTION_BUTTON);  /* eslint-disable-line */
    hooks = {};

    htmlElements = {};
    designClasses = {};
}


/**
 * Add a global hook that is triggered for all messages.
 *
 * @public
 * @param {string} hookType
 * @param {function|null} hookFunction the callback to run
 * @returns {void}
 * @throws {TypeError|Error} if invalid hook type is used
 */
export function setGlobalHook(hookType, hookFunction) {
    verifyHook(hookType, hookFunction);

    if (!(hookType in globalHooks)) {
        // this should, currently, never happen as all hooks use the template
        throw new Error(`Hook type "${hookType}" is not valid for the global hook.`);
    }

    globalHooks[hookType] = hookFunction;
}
