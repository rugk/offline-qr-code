/**
 * Load, save and apply options to HTML options page.
 *
 * @module modules/CustomOptionTriggers
 */

import * as Logger from "/common/modules/Logger.js";
import * as AutomaticSettings from "./AutomaticSettings/AutomaticSettings.js";
import * as MessageHandler from "/common/modules/MessageHandler.js";
import { MESSAGE_LEVEL } from "/common/modules/data/MessageLevel.js";

// used to apply options
import * as Colors from "/common/modules/Colors.js";
import * as IconHandler from "/common/modules/IconHandler.js";

const REMEBER_SIZE_INTERVAL = 500; // sec

const elContrastMessage = document.getElementById("messageContrast");

let updateRemberedSizeInterval = null;

/**
 * Adjust UI if QR code size option is changed.
 *
 * @function
 * @private
 * @param  {Object} optionValue
 * @param  {string} [option]
 * @returns {void}
 */
function applyQrCodeSize(optionValue) {
    const elQrCodeSize = document.getElementById("size");

    if (optionValue.sizeType === "fixed") {
        // round not so nice values to better values
        let sizeValue = Number(optionValue.size);
        // increase number if the difference to next heigher number (dividable by 5) is smaller
        if (sizeValue % 5 >= 3 ) {
            sizeValue += 5;
        }
        // "divide" by 5 to get only these values
        optionValue.size = sizeValue - (sizeValue % 5);

        elQrCodeSize.value = optionValue.size;
        elQrCodeSize.removeAttribute("disabled");
    } else {
        // disable input of number when remember option is selected
        elQrCodeSize.setAttribute("disabled", "");
    }

    // enable auto-update of size in input field (if changed while settings are open)
    if (optionValue.sizeType === "remember") {
        updateRemberedSizeInterval = setInterval((elQrCodeSize) => {
            // update element and ignore disabled status and that is of course wanted
            AutomaticSettings.setSyncedOption("size", "qrCodeSize", elQrCodeSize, true);
        }, REMEBER_SIZE_INTERVAL, elQrCodeSize);
    } else if (updateRemberedSizeInterval !== null) {
        clearInterval(updateRemberedSizeInterval);
    }
}

/**
 * Adjust UI if QR code size option is changed.
 *
 * @function
 * @private
 * @param  {boolean} optionValue
 * @param  {string} [option]
 * @returns {void}
 */
function applyPopupIconColor(optionValue) {
    IconHandler.changeIconIfColored(optionValue);
}

/**
 * Adjust UI if QR code size option is changed.
 *
 * @function
 * @private
 * @param  {boolean} optionValue
 * @param  {string} [option]
 * @returns {void}
 */
function applyDebugMode(optionValue) {
    Logger.setDebugMode(optionValue);
}

/**
 * Apply the colors of the QR code.
 *
 * @function
 * @private
 * @param  {string} optionValue
 * @param  {string} option
 * @returns {void}
 */
function applyQrCodeColors(optionValue, option) {
    const elQrColor = document.getElementById("qrColor");
    const elQrBackgroundColor = document.getElementById("qrBackgroundColor");

    /* Variable naming:
     * prefix: option… – option string
     * prefix: optionValue… – color value as string ("RAW")
     * prefix: color… – color value in RGB array
     * prefix: elColor… – input HTML element for color
     *
     * suffix: …<none> – original value, not to be changed
     * suffix: …Compare – value to compare with, may be inverted/changed
     */

    // find out which is the "other" element (the one that was not changed),
    // which is used as a comparision to the current (changed) value
    let optionCompare, elColor, elColorCompare;
    if (option === "qrColor") {
        optionCompare = "qrBackgroundColor";
        elColor = elQrColor;
        elColorCompare = elQrBackgroundColor;
    } else { // option === "qrBackgroundColor"
        optionCompare = "qrColor";
        elColor = elQrBackgroundColor;
        elColorCompare = elQrColor;
    }

    const color = Colors.hexToRgb(optionValue);

    const optionValueCompare = elColorCompare.value;
    const colorCompare = Colors.hexToRgb(optionValueCompare);

    const colorContrast = Colors.contrastRatio(color, colorCompare);

    Logger.logInfo(`Checking color between static color "${optionValue}" == ${color} (${option}) and to-be-changed color "${optionValueCompare}" == ${colorCompare} (${optionCompare}). Has contrast ${colorContrast}.`);

    const actionButton = {
        text: "messageAutoSelectColorButton",
        action: () => {
            // replace comparison color with inverted color of QR code,
            // because the one the user just changed is likely the one
            // they want to keep
            const invertedColor = Colors.invertColor(color);
            browser.storage.sync.set({
                [optionCompare]: invertedColor
            }).catch((error) => {
                Logger.logError("could not save option", optionCompare, ":", error);
                MessageHandler.showError("couldNotSaveOption", true);
            }).finally(() => {
                // also display/"preview" other compared color,
                // (This is needed when users change the color of the preview only (via customOptionTrigger()) and click the action button.)
                elColor.value = optionValue;

                elColorCompare.value = invertedColor;

                // re-check color options again, unless the implementation is buggy this should never get into a loop
                applyQrCodeColors(invertedColor, optionCompare);
            });
        }
    };

    // breakpoints: https://github.com/rugk/offline-qr-code/pull/86#issuecomment-390426286
    if (colorContrast <= Colors.CONTRAST_RATIO.WAY_TOO_LOW) {
        // show an error when nearly no QR code scanner can read it
        MessageHandler.setMessageDesign(elContrastMessage, MESSAGE_LEVEL.ERROR);
        MessageHandler.showMessage(elContrastMessage, "lowContrastRatioError", false, actionButton);
    } else if (colorContrast <= Colors.CONTRAST_RATIO.LARGE_AA) {
        // show a warning when approx. 50% of the QR code scanners can read it
        MessageHandler.setMessageDesign(elContrastMessage, MESSAGE_LEVEL.WARN);
        MessageHandler.showMessage(elContrastMessage, "lowContrastRatioWarning", false, actionButton);
    } else if (colorContrast <= Colors.CONTRAST_RATIO.LARGE_AAA) {
        // show only an info when the contrast is low but most of the scanners can still read it
        MessageHandler.setMessageDesign(elContrastMessage, MESSAGE_LEVEL.INFO);
        MessageHandler.showMessage(elContrastMessage, "lowContrastRatioInfo", false, actionButton);
    } else if (elContrastMessage) {
        // hide any message if the contrast is all right
        MessageHandler.hideMessage(elContrastMessage);
    }
}

/**
 * Binds the triggers.
 *
 * This is basically the "init" method.
 *
 * @function
 * @returns {void}
 */
export function registerTrigger() {
    AutomaticSettings.Trigger.registerSave("qrCodeSize", applyQrCodeSize);
    AutomaticSettings.Trigger.registerSave("popupIconColored", applyPopupIconColor);
    AutomaticSettings.Trigger.registerSave("debugMode", applyDebugMode);
    AutomaticSettings.Trigger.registerSave("qrColor", applyQrCodeColors);
    AutomaticSettings.Trigger.registerSave("qrBackgroundColor", applyQrCodeColors);

    AutomaticSettings.Trigger.registerUpdate("qrColor", applyQrCodeColors);
    AutomaticSettings.Trigger.registerUpdate("qrBackgroundColor", applyQrCodeColors);
}
