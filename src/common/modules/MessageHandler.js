// lodash
import {MESSAGE_LEVEL} from "/common/modules/data/MessageLevel.js";
import isFunction from "/common/modules/lib/lodash/isFunction.js";

import * as Logger from "/common/modules/Logger.js";

let ELEMENT_BY_TYPE;

// documents the classes for the different message styles
const DESIGN_BY_TYPE = Object.freeze({
    [MESSAGE_LEVEL.ERROR]: "error",
    [MESSAGE_LEVEL.WARN]: "warning",
    [MESSAGE_LEVEL.INFO]: "info",
    [MESSAGE_LEVEL.SUCCESS]: "success",
    [MESSAGE_LEVEL.LOADING]: "info"
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
        hideMessage(elMessage);

        runHook("global", "dismissEnd", {
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
function getCustomMessageType(elMessage) {
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
    let messagetype = Object.keys(ELEMENT_BY_TYPE).find((messagetype) => {
        // skip, if element does not exist
        if (!ELEMENT_BY_TYPE[messagetype]) {
            return false;
        }

        return ELEMENT_BY_TYPE[messagetype].isEqualNode(elMessage);
    });

    if (messagetype === undefined) {
        // this throws if it is no real (custom) message
        messagetype = getCustomMessageType(elMessage);
    }

    return messagetype;
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
 * @param {MESSAGE_LEVEL|HTMLElement} messagetype
 * @returns {Array.<string, HTMLElement, boolean>}
 * @throws {Error}
 */
function getElementFromMessageType(messagetype) {
    let elMessage,
        isCustomMessage = false;

    if (messagetype instanceof HTMLElement) {
        // handle custom messages first
        elMessage = messagetype;

        messagetype = getCustomMessageType(elMessage);

        isCustomMessage = true;
    } else if (messagetype in ELEMENT_BY_TYPE) {
        // verify string message types are valid
        elMessage = ELEMENT_BY_TYPE[messagetype];

        if (elMessage === null) {
            throw new Error(`message type ${messagetype} has no corresponding HTMLElement`);
        }
    } else {
        throw new Error(`message type ${messagetype} is/belong to an unknown element`);
    }

    return [messagetype, elMessage, isCustomMessage];
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

    const messagetype = getMessageTypeFromElement(elMessage);

    Logger.logInfo("action button clicked for ", messagetype, event);

    runHook(messagetype, "actionButton", {
        elMessage,
        messagetype,
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
    const newDesign = DESIGN_BY_TYPE[newDesignType];
    const elActionButton = elMessage.getElementsByClassName("message-action-button")[0];

    // set new design
    elMessage.classList.add(newDesign);
    elActionButton.classList.add(newDesign);

    // unset old design
    Object.values(DESIGN_BY_TYPE).forEach((oldDesign) => {
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
 * @param {MESSAGE_LEVEL|HTMLElement} messagetype
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showMessage(...args) {
    if (arguments.length <= 0) {
        Logger.logError("MessageHandler.showMessage has been called without parameters");
        return;
    }

    // also log message to console
    if (args[0] instanceof HTMLElement) {
        Logger.logInfo(...args);
    } else {
        Logger.log(...args);
    }

    // get first element
    const [messagetype, elMessage, isCustomMessage] = getElementFromMessageType(args.shift());

    if (isCustomMessage) {
        // automatically register/setup hook object when new message is passed
        if (hooks[messagetype] === undefined) {
            hooks[messagetype] = {
                "show": null,
                "hide": null,
                "actionButton": null
            };
        }
    }

    // and stuff inside we need later
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
        if (isFunction(actionButton.action)) {
            // save option to be called later
            hooks[messagetype].actionButton = actionButton.action;

            // potentiall remove previous set thing
            elActionButtonLink.removeAttribute("href");
        } else {
            elActionButtonLink.setAttribute("href", actionButton.action);

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
}

/**
 * Hides the message type(s), you specify.
 *
 * If you pass no messagetype or "null", it hides all messages. (except custom ones)
 * If a HTMLElement is passed, it automatically hides the target of the event.
 * Attention: This is a "low-level function" and does thus not run the hide hook!
 *
 * @function
 * @param  {MESSAGE_LEVEL|null|HTMLElement} messagetype
 * @returns {void}
 */
export function hideMessage(messagetype) {
    // hide all messages if type is not specified
    if (messagetype === null || messagetype === undefined) {
        // hide all of them
        for (const currentType of Object.values(MESSAGE_LEVEL)) {
            // recursive call myself to hide element
            hideMessage(currentType);
        }

        return;
    }

    const [, elMessage] = getElementFromMessageType(messagetype);
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
 * Clones a message HTMLElement you specify.
 *
 * It sorts the message directly after the message you clone.
 * The message is hidden by default – regardless of the state of the origin
 * message (type).
 *
 * CURRENTLY UNUSED.
 *
 * @function
 * @param  {MESSAGE_LEVEL|HTMLElement} messagetype
 * @param  {string} newId New ID to use for that element
 * @returns {HTMLElement}
 */
export function cloneMessage(messagetype, newId) {
    let elMessage = null;

    [messagetype, elMessage] = getElementFromMessageType(messagetype);

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
 * Hides the error message.
 *
 * @function
 * @returns {void}
 */
export function hideError() {
    runHook(MESSAGE_LEVEL.ERROR, "hide");
    hideMessage(MESSAGE_LEVEL.ERROR);
}

/**
 * Hide warning message.
 *
 * @function
 * @returns {void}
 */
export function hideWarning() {
    runHook(MESSAGE_LEVEL.WARN, "hide");
    hideMessage(MESSAGE_LEVEL.WARN);
}

/**
 * Hide info message.
 *
 * @function
 * @returns {void}
 */
export function hideInfo() {
    runHook(MESSAGE_LEVEL.INFO, "hide");
    hideMessage(MESSAGE_LEVEL.INFO);
}

/**
 * Hide loading message.
 *
 * @function
 * @returns {void}
 */
export function hideLoading() {
    runHook(MESSAGE_LEVEL.LOADING, "hide");
    hideMessage(MESSAGE_LEVEL.LOADING);
}

/**
 * Hide success message.
 *
 * @function
 * @returns {void}
 */
export function hideSuccess() {
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
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showError(...args) {
    runHook(MESSAGE_LEVEL.ERROR, "show", args);

    args.unshift(MESSAGE_LEVEL.ERROR);
    showMessage(...args);
}

/**
 * Show an warning message.
 *
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showWarning(...args) {
    runHook(MESSAGE_LEVEL.WARN, "show", args);

    args.unshift(MESSAGE_LEVEL.WARN);
    showMessage(...args);
}

/**
 * Show an info message.
 *
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string} actionButton.link URL to site to open on link
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showInfo(...args) {
    runHook(MESSAGE_LEVEL.INFO, "show", args);

    args.unshift(MESSAGE_LEVEL.INFO);
    showMessage(...args);
}

/**
 * Shows a loading message.
 *
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showLoading(...args) {
    runHook(MESSAGE_LEVEL.LOADING, "show", args);

    args.unshift(MESSAGE_LEVEL.LOADING);
    showMessage(...args);
}

/**
 * Show a success message.
 *
 * @function
 * @param {string} [message] optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} [isDismissable] optional, set to true, if user should be able to dismiss the message
 * @param {Object} [actionButton] optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showSuccess(...args) {
    runHook(MESSAGE_LEVEL.SUCCESS, "show", args);

    args.unshift(MESSAGE_LEVEL.SUCCESS);
    showMessage(...args);
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
 * @function
 * @param  {MESSAGE_LEVEL|HtmlElement} messagetype use string "global" for a global hook
 * @param {function|null} hookShown
 * @param {function|null} hookHidden
 * @returns {void}
 */
export function setHook(messagetype, hookShown, hookHidden) {
    hooks[messagetype].show = hookShown;
    hooks[messagetype].hide = hookHidden;
}

/**
 * Called when a message is dismissed.
 *
 + When called, the function does not know, which message is hidden, but you
 * can determinante it by yourself.
 * The called hook gets an object with two parameters:
 * - {HTMLElement} elMessage – the message element, which was hidden
 * - {event} event – the original click even on the dismiss button
 *
 * @function
 * @param {function|null} [startHook]
 * @param {function|null} [endHook]
 * @returns {void}
 */
export function setDismissHooks(startHook, endHook) {
    hooks.global.dismissStart = startHook;
    hooks.global.dismissEnd = endHook;
}

/**
 * Initialises the module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    // reload messages
    ELEMENT_BY_TYPE = Object.freeze({
        [MESSAGE_LEVEL.ERROR]: document.getElementById("messageError"),
        [MESSAGE_LEVEL.WARN]: document.getElementById("messageWarning"),
        [MESSAGE_LEVEL.INFO]: document.getElementById("messageInfo"),
        [MESSAGE_LEVEL.SUCCESS]: document.getElementById("messageSuccess"),
        [MESSAGE_LEVEL.LOADING]: document.getElementById("messageLoading")
    });

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
}

// init module automatically
init();

Logger.logInfo("MessageHandler module loaded.");
