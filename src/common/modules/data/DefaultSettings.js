/**
 * Sets the default settings for
 *
 * @module data/DefaultSettings
 */

export const DEFAULT_SETTINGS = Object.freeze({
    debugMode: false,
    popupIconColored: false,
    preprocessText: true,
    qrCodeType: "svg",
    qrColor: "#0c0c0d",
    qrBackgroundColor: "#ffffff",
    qrErrorCorrection: "Q",
    autoGetSelectedText: false,
    monospaceFont: false,
    qrCodeSize: {
        sizeType: "fixed",
        size: 200
    },
    randomTips: {
        tips: {}
    }
});
