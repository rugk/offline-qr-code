import * as Logger from "/common/modules/Logger.js";

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
export function init() {
    document.querySelectorAll(`[${I18N_ATTRIBUTE}]`).forEach((currentElem) => {
        Logger.logInfo("init translate", currentElem);

        const contentString = currentElem.getAttribute(I18N_ATTRIBUTE);
        replaceI18n(currentElem, contentString);
    });

    // replace html lang attribut after translation
    document.querySelector("html").setAttribute("lang", browser.i18n.getUILanguage());
}

// automatically init module
init();

Logger.logInfo("Localiser module loaded.");
