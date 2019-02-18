/**
 * Sets the default settings for the AddonSettings module.
 *
 * @module data/DefaultSettings
 * @requires AddonSettings
 */

export const DEFAULT_SETTINGS = Object.freeze({
    debugMode: false,
    popupIconColored: false,
    qrCodeType: "svg",
    qrColor: "#0c0c0d",
    qrBackgroundColor: "#ffffff",
    qrErrorCorrection: "Q",
    autoGetSelectedText: false,
    monospaceFont: false,
    qrCodeSize: {
        sizeType: "fixed",
        size: 220
    },
    qrQuietZone: 1,
    randomTips: {
        tips: {}
    }
});
