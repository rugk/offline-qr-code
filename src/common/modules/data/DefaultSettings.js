/**
 * Specifies the default settings of the add-on.
 *
 * @module data/DefaultSettings
 */

// checks for OS dark theme
const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

/**
 * An object of all default settings.
 *
 * @private
 * @const
 * @type {Object}
 */
const defaultSettings = Object.freeze({
    debugMode: false,
    popupIconColored: false,
    qrColor: "#0c0c0d",
    qrBackgroundColor: (isDarkTheme ? "#d7d7db" : "#ffffff"), // dark uses Firefox Photon's grey-30
    qrErrorCorrection: "Q",
    autoGetSelectedText: false,
    monospaceFont: false,
    disableContextMenu: false,
    qrCodeSize: {
        sizeType: "fixed",
        size: 220
    },
    qrQuietZone: 1,
    randomTips: {
        tips: {}
    }
});

// freeze the inner objects, this is strongly recommend
Object.values(defaultSettings).map(Object.freeze);

/**
 * Export the default settings to be used.
 *
 * @public
 * @const
 * @type {Object}
 */
export const DEFAULT_SETTINGS = Object.freeze(defaultSettings);
