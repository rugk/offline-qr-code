/**
 * Convert and calculate values of colors.
 *
 * @module /common/modules/Colors
 */

/**
 * Some breakpoints for specific color ratios.
 *
 * This includes definitions from WCAG and some custom ones.
 *
 * @type {object} with integers
 * @const
 * @default
 */
export const CONTRAST_RATIO = Object.freeze({
    WAY_TOO_LOW: 2,
    // WCAG 2.1 AA text: https://www.w3.org/TR/WCAG/#contrast-minimum
    LARGE_AA: 3.1,
    SMALL_AA: 4.5,
    // WCAG 2.1 AAA text: https://www.w3.org/TR/WCAG/#contrast-enhanced
    LARGE_AAA: 4.5,
    SMALL_AAA: 7.5,
    // WCAG 2.1 AA non-text: https://www.w3.org/TR/WCAG/#non-text-contrast
    NON_TEXT_AA: 3.1
});

/**
 * Calculates the contrast between two colors
 *
 * @function
 * @param  {Array} rgb1
 * @param  {Array} rgb2
 * @returns {int}
 */
export function contrastRatio(rgb1, rgb2) {
    const l1 = luminance(rgb1);
    const l2 = luminance(rgb2);
    // Formula: https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Calculates the luminance of a given RGB color.
 *
 * @function
 * @private
 * @param  {Array} rgb
 * @returns {Array|null}
 */
function luminance(rgb) {
    // Formula: https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;
    // Note: I'm using 0.04045 here (instead of 0.03928) because 0.04045 is the
    // number used in the actual sRGB standard.
    // See also: https://github.com/w3c/wcag21/issues/815
    r = r < 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g < 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b < 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Returns the complementary color of a given RGB array.
 *
 * @function
 * @param  {Array} rgb
 * @returns {string}
 */
export function invertColor(rgb) {
    // invert color components
    const r = (255 - rgb[0]).toString(16);
    const g = (255 - rgb[1]).toString(16);
    const b = (255 - rgb[2]).toString(16);
    // pad each with zeros and return
    return `#${padZero(r)}${padZero(g)}${padZero(b)}`;
}

/**
 * Adds missing zeros in front of a string.
 *
 * @function
 * @private
 * @param  {string} string
 * @param  {int} length
 * @returns {string}
 */
function padZero(string, length) {
    length = length || 2;
    const zeros = new Array(length).join("0");
    return (zeros + string).slice(-length);
}

/**
 * Converts a hex color string to RGB.
 *
 * @function
 * @param  {string} hex
 * @returns {Array|null}
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ];
    }
    return null;
}
