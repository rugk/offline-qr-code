// lodash
import isObject from "/common/modules/lib/lodash/isObject.js";

import * as Logger from "/common/modules/Logger.js";

let gettingManagedOption;
let gettingSyncOption;

let managedOptions = null;
let syncOptions = null;

const defaultValues = Object.freeze({
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
        size: 200
    },
    randomTips: {
        tips: {}
    }
});

/**
 * Get the default value.
 *
 * Returns undefined, if option cannot be found.
 *
 * @name   AddonSettings.getDefaultValue
 * @function
 * @param  {string|null} option name of the option
 * @returns {Object|undefined}
 */
export function getDefaultValue(option) {
    // return all default values
    if (!option) {
        return defaultValues;
    }

    // if undefined
    if (defaultValues.hasOwnProperty(option)) {
        return defaultValues[option];
    } else {
        Logger.logError(`Default value for "${option}" missing.`);
        return undefined;
    }
}

/**
 * Returns the add-on setting to use in add-on.
 *
 * If only a single option is requested (option=string) the result of the
 * promise will be that return value;
 *
 * @name   AddonSettings.get
 * @function
 * @param  {string|null} option name of the option
 * @returns {Promise}
 */
export async function get(option) {
    let result = undefined;
    option = option || null; // null requests for all options

    await gettingManagedOption.catch(() => {
        // ignore error, as failing is expected here
    });

    // first try to get managed option
    if (managedOptions != null) {
        if (!option) {
            result = managedOptions;
        } else if (managedOptions.hasOwnProperty(option)) {
            result = managedOptions[option];
            Logger.logInfo(`Managed setting got for "${option}".`, result);
        }
    } else {
        // get synced option, otherwise
        await gettingSyncOption.catch(() => {
            // fatal error (likely already logged), requires synced options
            Promise.reject(new Error("synced options not available"));
        });

        if (syncOptions != null) {
            if (!option) {
                result = syncOptions;
            } else if (syncOptions.hasOwnProperty(option)) {
                result = syncOptions[option];
                Logger.logInfo(`Synced setting got for "${option}".`, result);
            }
        }
    }

    // if result is still undefined, get default value
    if (result === undefined) {
        // get default value as a last fallback
        result = getDefaultValue(option);
        // last fallback: default value
        Logger.logWarning(`Could not get option "${option}". Using default.`, result);

    } else if (!option) {
        // if all values should be returned, also include all default ones in addition to fetched ones
        result = Object.assign({}, getDefaultValue(option), result);
    }

    return result;
}

/**
 * Sets the settings.
 *
 * Note you can pass an key -> value object to set here.
 *
 * @name   AddonSettings.set
 * @see {@link https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/StorageArea/set}
 * @function
 * @param  {Object|string} option keys/values to set or single value
 * @param  {Object} value if only a single value is to be set
 * @returns {Promise}
 */
export function set(option, value) {
    // put params into object if needed
    if (!isObject(option)) {
        option = {
            [option]: value
        };
    }

    return browser.storage.sync.set(option).catch((error) => {
        Logger.logError("Could not save option:", option, error);
    });
}

/**
 * Fetches all options, so they can be used later.
 *
 * This is basically the init method!
 * It returns a promise, but that must not be used, because the module is
 * built in a way, so that the actual getting of the options is waiting for
 * the promise.
 *
 * @name   AddonSettings.loadOptions
 * @function
 * @returns {Promise}
 */
export function loadOptions() {
    // just fetch everything
    gettingManagedOption = browser.storage.managed.get();
    gettingSyncOption = browser.storage.sync.get();

    gettingManagedOption.then((options) => {
        managedOptions = options;
    }).catch((error) => {
        /* only log warning as that is expected when no manifest file is found */
        Logger.logWarning("could not get managed options", error);
    });

    gettingSyncOption.then((options) => {
        syncOptions = options;
    }).catch((error) => {
        Logger.logError("could not get sync options", error);
    });

    // if the settings have been received anywhere, they could be loaded
    return Promise.race([gettingManagedOption, gettingSyncOption]);
}

// automatically fetch options
loadOptions().then(() => {
    Logger.logInfo("AddonSettings module loaded.");
});
