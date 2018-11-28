import * as Logger from "/common/modules/Logger/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

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
        throw new TypeError(`invalid parameter: ${icon}`);
    }

    // ignore request if API is not available
    if (browser.browserAction.setIcon === undefined) {
        return Promise.resolve();
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
