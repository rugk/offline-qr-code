/**
 * Functions useful for evaluating language-related things.
 *
 * @public
 * @module LanguageHelper
 */

/**
 * The list of languages the add-on is already translated into.
 *
 * If the add-on is only partially translated into one of these langauges and
 * there may be a lot of strings that are missing it's localized version, it may
 * be removed from that list here.
 *
 * Include the base language and the region-specific version you want to target,
 * even if you only have a general translation for the base locale.
 *
 * @private
 * @type {string[]}
 */
const ADDON_TRANSLATED_INTO = [
    // German
    "de", "de-DE",
    // English
    "en", "en-US",
    // Turkish
    "tr", "tr-TR",
    // French
    "fr", "fr-FR",
    // Portuguese
    "pt", "pt-BR",
    // Chinese not included yet, as it is not 100%ly translated
].map((lang) => lang.toLowerCase());

/**
 * Returns whether the user also speaks a language that the add-on is not
 * translated into.
 *
 * @public
 * @returns {boolean}
 */
export async function userSpeaksLocaleNotYetTranslated() {
    const addonLanguage = browser.i18n.getMessage("@@ui_locale");
    const uiLanguage = browser.i18n.getUILanguage();
    const acceptedLanguages = await browser.i18n.getAcceptLanguages();

    console.log("Addon is translated into", addonLanguage, ", browser into ", uiLanguage, "and user accepts the languages", acceptedLanguages, ".");
    // Note: actually addonLanguage and uiLanguage should be the same, see https://discourse.mozilla.org/t/not-clear-that-there-are-three-locales/27533

    // for evaluation, we can assume the user also speaks the language their browser is translated into
    acceptedLanguages.push(uiLanguage);

    // if the language the user speaks is not already translated, they probably know another locale we do not know yet
    return acceptedLanguages.some((userLang) => ! ADDON_TRANSLATED_INTO.includes(userLang.toLowerCase()));
}
