/**
 * Creates and modifies a QR code with the QR code library "kjua".
 *
 * @module QrLib/qrgen
 * @requires /common/modules/Logger
 */
/* globals qrcodegen */

import * as Logger from "/common/modules/Logger/Logger.js";

const QRC = qrcodegen.QrCode;

let qrQuietZone;
let qrText;
let qrColor;
let qrErrorCorrection;

/**
 * The type of QR code this library generates.
 *
 * @type {string}
 * @const
 * @default
 */
export const GENERATION_TYPE = "svg";

/**
 * Generates an SVG element out of an SVG string.
 *
 * @function
 * @private
 * @param {string} svgString the SVG+XML string
 * @returns {SVGSVGElement}
 */
function getSvgElement(svgString) {
    const svg = (new DOMParser()).parseFromString(svgString, "image/svg+xml"); // XMLDocument
    const elSvg = svg.documentElement; // SVGSVGElement

    // modify SVG
    // transparent background
    elSvg.querySelector("rect").setAttribute("fill", "transparent");
    elSvg.querySelector("path").setAttribute("fill", qrColor);

    return elSvg;
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
    switch (tag) {
    case "size":
        // ignore as this property is not availavble in this lib
        break;
    case "text":
        qrText = value;
        break;
    case "qrQuietZone":
        qrQuietZone = value;
        break;
    case "qrColor":
        qrColor = value;
        break;
    case "qrBackgroundColor":
        // ignore as this property is not availavble in this lib
        break;
    case "qrErrorCorrection":
        switch (value) {
        case "H":
            qrErrorCorrection = QRC.Ecc.HIGH;
            break;
        case "Q":
            qrErrorCorrection = QRC.Ecc.QUARTILE;
            break;
        case "M":
            qrErrorCorrection = QRC.Ecc.MEDIUM;
            break;
        case "L":
            qrErrorCorrection = QRC.Ecc.LOW;
            break;
        default:
            throw new Error(`unknown error correction option passed: ${value}`);
        }
        break;
    default:
        throw new Error(`unknown tag passed to set: ${tag}`);
    }
}

/**
 * Return new QR code.
 *
 * @function
 * @returns {SVGSVGElement}
 */
export function getQr() {
    Logger.logInfo("generated new QrGen qr code");

    const qrElem = QRC.encodeText(qrText, qrErrorCorrection);
    const svgString = qrElem.toSvgString(qrQuietZone);

    return getSvgElement(svgString);
}
