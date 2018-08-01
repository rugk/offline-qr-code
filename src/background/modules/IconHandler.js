import * as Logger from "/common/modules/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";

/**
 * Sets a popup icon variant.
 *
 * @function
 * @private
 * @param {string} icon version or "null"/"undefined" to reset to default
 * @returns {void}
 */
function setPopupIcon(icon) {
    // verify parameter
    switch (icon) {
    case "dark": // fall through
    case "light":
    case "colored":
    case null:
        // ok
        break;
    default:
        throw Error(`invalid parameter: ${icon}`);
    }

    if (icon === null || icon === undefined) {
        browser.browserAction.setIcon({path: null});
        return;
    }

    browser.browserAction.setIcon({path: `icons/icon-small-${icon}.svg`});
}

/**
 * Init icon module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    AddonSettings.get("popupIconColored").then((res) => {
        const popupIconColored = res.popupIconColored;

        if (popupIconColored === true) {
            setPopupIcon("colored");
        } else {
            // reset icon
            setPopupIcon(null);
        }
    });
}

Logger.logInfo("IconHandler module loaded.");
