/**
 * Provides the data for the settings.
 *
 * Currently just used to provide the **default** data.
 *
 * @module internal/OptionsModel
 */

/**
 * This callback is called to retrieve the default value if it is not saved already.
 *
 * The callback is called with the option name in the same way
 * browser.storage.sync.get is called.
 * However, in contrast to browsers built-in functions, it will
 * never be called with an object or so, but only with a string.
 * This means only one option is retrieved at a time.
 *
 * @callback defaultOptionGetterCallback
 * @param {string} option
 * @return {Object}
 */
let defaultOptionGetter;

/**
 * Returns whether the default option provider is provided, so we can get some defaults.
 *
 * @private
 * @function
 * @returns {boolean}
 */
function canGetDefaults() {
    return defaultOptionGetter !== null;
}

/**
 * Sets the callback for getting the default options.
 *
 * See {@link defaultOptionGetterCallback} for how the callback needs to
 * behave.
 * You need to call this function before the main init function of
 * AutomaticSettings. However, if you do not want to specify defaults
 * in JS, but just in HTML, you can pass "null" to this and it will not
 * try to request defaults.
 * Pass "undefined" to it to unset it.
 *
 * @public
 * @function
 * @param {defaultOptionGetterCallback|null} defaultOptionCallback
 * @returns {void}
 */
export function setDefaultOptionProvider(defaultOptionCallback) {
    defaultOptionGetter = defaultOptionCallback;
}

/**
 * The actual function providing the default options.
 *
 * Returns "undefined" if default option provider is disabled.
 *
 * @public
 * @function
 * @param {string} option
 * @returns {Object|undefined}
 */
export function getDefaultOption(option) {
    // just check if it is ready
    verifyItIsReady();

    if (!canGetDefaults()) {
        return undefined;
    }

    return defaultOptionGetter(option);
}

/**
 * Returns the sync option or falls back to the default option.
 *
 * @public
 * @function
 * @param {string} option
 * @returns {Object|undefined}
 */
export async function getOption(option) {
    const optionValue = await browser.storage.sync.get(option);

    if (!(option in optionValue)) {
        return getDefaultOption(option);
    }

    return optionValue[option];
}

/**
 * Returns whether the module is ready yet.
 *
 * Usually throws if a bad error is found.
 *
 * @public
 * @function
 * @returns {boolean}
 * @throws {Error}
 */
export function verifyItIsReady() {
    if (defaultOptionGetter === undefined) {
        throw new Error("Default option provider is not set. You need to call setDefaultOptionProvider() before .init() to set it.");
    }

    return true;
}
