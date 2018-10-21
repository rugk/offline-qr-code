/**
 * Contains the function that does replacements of the data in the HTML element.
 *
 * This version of this file does not allow HTML code to be injected. Thus it is
 * safer to use and avoids problems with some linters that point out the usage of
 * "innerHtml".
 *
 * @module ./replaceInnerContent
 */

/**
 * Replaces inner content of the HTML element.
 *
 * This function determinates whether HTML is being replaced as HTML or not allowed
 * (in order to avoid a dependency on innerHTML).
 *
 * @function
 * @private
 * @param  {HTMLElement} elem
 * @param  {string} translatedMessage
 * @returns {void}
 */
export function replaceInnerContent(elem, translatedMessage) {
    elem.textContent = translatedMessage;
}
