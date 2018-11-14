/**
 * Creates and modifies a QR code with the QR code library "kjua".
 *
 * @module QrLib/kjua
 * @requires /common/modules/Logger
 */
/* globals kjua */

import * as Logger from "/common/modules/Logger/Logger.js";

/**
 * The type of QR code this library generates.
 *
 * @type {string}
 * @const
 * @default
 */
export const GENERATION_TYPE = "canvas";

/**
 * The saved options for Kjua.
 *
 * @private
 */
let kjuaOptions;

/**
 * How options need to be mapped from general options to kjua.
 *
 * format: generalOpt => kjua
 *
 * @private
 */
const OPTIONS_MAP = Object.freeze({
    "qrQuietZone": "quiet",
    "qrColor": "fill",
    "qrBackgroundColor": "back",
    "qrErrorCorrection": "ecLevel"
});

/**
 * Resets all options for the QR code.
 *
 * @function
 * @returns {HTMLElement}
 */
export function reset() {
    kjuaOptions = {
        // render method: 'canvas' or 'image'
        render: "canvas",

        // render pixel-perfect lines
        crisp: true,

        // minimum version: 1..40
        minVersion: 1,

        // error correction level: 'L', 'M', 'Q' or 'H'
        ecLevel: "H",

        // size in pixel
        size: 200,

        // pixel-ratio, null for devicePixelRatio
        ratio: null,

        // code color
        fill: "#0c0c0d",

        // background color
        back: "#ffffff",

        // roundend corners in pc: 0..100
        rounded: 0,

        // quiet zone in modules
        quiet: 0,

        // modes: 'plain', 'label' or 'image'
        mode: "plain",

        // label/image size and pos in pc: 0..100
        mSize: 30,
        mPosX: 50,
        mPosY: 50
    };
}

/**
 * Set an option for the QR code.
 *
 * @function
 * @param {string} tag the common one you know from the outside, e.g. size
 * @param {Object} value the value to set for this tag
 * @returns {void}
 */
export function set(tag, value) {
    if (OPTIONS_MAP.hasOwnProperty(tag)) {
        tag = OPTIONS_MAP[tag];
    }

    // TODO: should it reject invalid values?

    kjuaOptions[tag] = value;
}

/**
 * Return new QR code.
 *
 * @function
 * @returns {HTMLElement}
 */
export function getQr() {
    Logger.logInfo("generated new qr kjua code", kjuaOptions);
    return kjua(kjuaOptions);
}

/**
 * Init connector module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    reset();
}
