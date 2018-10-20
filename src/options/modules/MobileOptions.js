/**
 * Adjusts options page for mobile (Android) compatibility.
 *
 * Notice: You can include this asyncronously even if the whole DOM is not parsed yet.
 * It only accesses the body tag and that is very likely available as it's likely one of
 * the first HTML tags you write and only include this script afterwards.
 * This prevents unnecessary flackering when the CSS is added and the browser needs to
 * re-parse/render the HTML.
 *
 * @module modules/MobileOptions
 */

/**
 * Returns whether the current runtime is a mobile one (true) or not (false).
 *
 * @function
 * @private
 * @returns {Promise} with Boolean
 */
async function isMobile() {
    const platformInfo = await browser.runtime.getPlatformInfo();

    if (platformInfo.os !== "android") {
        return false;
    }

    return true;
}

/**
 * Initalize this module.
 *
 * Currently this just adds a CSS class.
 * You can e.g. use this to disable all incompatible options on mobile devices.
 *
 * @private
 * @returns {Promise}
 */
export async function init() {
    if (!(await isMobile())) {
        return;
    }

    document.querySelector("body").classList.add("mobile");
}
