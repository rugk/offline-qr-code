/**
 * Adjusts options page for mobile (Android) compatibility.
 *
 * Notice: You can include this asyncronously even if the whole DOM is not parsed yet.
 * It only accesses the body tag and that is very likely available as it's likely one of
 * the first HTML tags you write and only include this script afterwards.
 * This prevents unnecessary flackering when the CSS is added and the browser needs to
 * re-parse/render the HTML.
 *
 * @public
 * @module MobileOptions
 */

/**
 * Returns whether the current runtime is a mobile one (true) or not (false).
 *
 * @public
 * @returns {Promise} with Boolean
 */
export async function isMobile() {
    const platformInfo = await browser.runtime.getPlatformInfo();

    return platformInfo.os === "android";
}
