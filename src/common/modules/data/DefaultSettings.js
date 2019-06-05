/**
 * Specifies the default settings of the add-on.
 *
 * @module data/DefaultSettings
 */

// checks for OS dark theme
const darkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

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
    qrCodeType: "svg",
    qrColor: "#0c0c0d",
    qrBackgroundColor: (darkTheme ? "#d7d7db" : "#ffffff"),
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
