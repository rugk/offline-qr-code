/**
 * Translates WebExtension's HTML document by attributes.
 *
 * @module /common/modules/Localizer
 * @requires /common/modules/Logger
 */
import * as Logger from "/common/modules/Logger.js";

const I18N_ATTRIBUTE = "data-i18n";
const I18N_DATASET = "i18n";

const LOCALIZED_ATTRIBUTES = [
    "placeholder",
    "alt",
    "href",
    "aria-label"
];

/**
 * Splits the _MSG__*__ format and returns the actual tag.
 *
 * The format is defined in {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n/Locale-Specific_Message_reference#name}.
 *
 * @function
 * @private
 * @param  {string} tag
 * @returns {string}
 * @throws {Error} if pattern does not match
 */
function getMessageTag(tag) {
    /** {@link https://regex101.com/r/LAC5Ib/1} **/
    const splitMessage = tag.split(/^__MSG_([\w@]+)__$/);

    // throw custom exception if input is invalid
    if (splitMessage.length < 2) {
        throw new Error(`invalid message tag pattern "${tag}"`);
    }

    return splitMessage[1];
}

/**
 * Returns the translated message when a key is given.
 *
 * @function
 * @private
 * @param  {string} messageName
 * @param  {string[]} [substitutions]
 * @returns {string} translated string
 * @throws {Error} if no translation could be found
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/i18n/getMessage}
 */
function getTranslatedMessage(messageName, substitutions) {
    const translatedMessage = browser.i18n.getMessage(messageName, substitutions);
    if (!translatedMessage) {
        throw new Error(`no translation string for "${messageName}" could be found`);
    }

    return translatedMessage;
}

/**
 * Replaces inner content of HTML element.
 *
 * This function determinates whether HTML is being replaced as HTML or not allowed
 * (in order to avoid a dependency on innerHTML).
 *
 * @function
 * @private
 * @param  {HTMLElement} elem
 * @param  {string} translatedMessage
 * @param  {boolean} isHTML determinates whether the string is an HTML string
 * @returns {void}
 */
function replaceInnerContent(elem, translatedMessage, isHTML) {
    if (isHTML) {
        elem.innerHTML = translatedMessage;
    } else {
        elem.textContent = translatedMessage;
    }
}

/**
 * Replaces attribute or inner text of element with string.
 *
 * @function
 * @private
 * @param  {HTMLElement} elem
 * @param  {string} attribute attribute to replace, set to "null" to replace inner content
 * @param  {string} translatedMessage
 * @returns {void}
 */
function replaceWith(elem, attribute, translatedMessage) {
    const isHTML = translatedMessage.startsWith("!HTML!");
    if (isHTML) {
        translatedMessage = translatedMessage.replace("!HTML!", "").trimLeft();
    }

    switch (attribute) {
    case null:
        replaceInnerContent(elem, translatedMessage, isHTML);
        break;
    default:
        // attributes are never allowed to contain unbescaped HTML
        elem.setAttribute(attribute, translatedMessage);
    }
}

/**
 * Localises the strings to localize in the HTMLElement.
 *
 * @function
 * @private
 * @param  {HTMLElement} elem
 * @param  {string} tag the translation tag
 * @returns {void}
 */
function replaceI18n(elem, tag) {
    // localize main content
    if (tag !== "") {
        try {
            const translatedMessage = getTranslatedMessage(getMessageTag(tag));
            replaceWith(elem, null, translatedMessage);
        } catch (error) {
            // log error but continue translating as it was likely just one problem in one translation
            Logger.logError(error);
        }
    }

    // replace attributes
    LOCALIZED_ATTRIBUTES.forEach((currentAttribute) => {
        const currentLocaleAttribute = `${I18N_ATTRIBUTE}-${currentAttribute}`;

        if (!elem.hasAttribute(currentLocaleAttribute)) {
            return;
        }

        try {
            const attributeTag = elem.getAttribute(currentLocaleAttribute);
            const translatedMessage = getTranslatedMessage(getMessageTag(attributeTag));
            replaceWith(elem, currentAttribute, translatedMessage);
        } catch (error) {
            // log error but continue translating as it was likely just one problem in one translation
            Logger.logError(error);
        }
    });
}

/**
 * Localizes static strings in the HTML file.
 *
 * @function
 * @returns {void}
 */
export function init() {
    document.querySelectorAll(`[${I18N_ATTRIBUTE}]`).forEach((currentElem) => {
        Logger.logInfo("init translate", currentElem);

        const contentString = currentElem.dataset[I18N_DATASET];
        replaceI18n(currentElem, contentString);
    });

    // replace html lang attribut after translation
    document.querySelector("html").setAttribute("lang", browser.i18n.getUILanguage());
}

// automatically init module
init();

Logger.logInfo("Localizer module loaded.");
