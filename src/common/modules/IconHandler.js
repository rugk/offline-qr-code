import * as Logger from "/common/modules/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";

const POPUP_ICON_OPTION = "popupIconColored";

/**
 * Sets a popup icon variant.
 *
 * @private
 * @param {string} icon version or "null"/"undefined" to reset to default
 * @returns {Promise}
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
        return browser.browserAction.setIcon({path: null});
    }

    return browser.browserAction.setIcon({path: `/icons/icon-small-${icon}.svg`});
}

/**
 * Set icon depending on whether it should be colored, or not.
 *
 * @public
 * @param {boolean} popupIconColored if popupIconColored is colored or not
 * @returns {Promise}
 */
export function changeIconIfColored(popupIconColored) {
    if (popupIconColored === true) {
        return setPopupIcon("colored");
    } else {
        // reset icon
        return setPopupIcon(null);
    }
}

/**
 * Init icon module.
 *
 * @public
 * @returns {void}
 */
export function init() {
    return AddonSettings.get(POPUP_ICON_OPTION).then((popupIconColored) => changeIconIfColored(popupIconColored));
}

Logger.logInfo("IconHandler module loaded.");
