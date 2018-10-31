/**
 * Caching wrapper for AddonSettings API that does save and load settings.
 *
 * @module /common/modules/AddonSettings
 * @requires /common/modules/lib/lodash/isObject
 * @requires /common/modules/Logger
 */
// lodash
import isObject from "/common/modules/lib/lodash/isObject.js";

import { DEFAULT_SETTINGS } from "./data/DefaultSettings.js";

import * as Logger from "/common/modules/Logger.js";

let gettingManagedOption;
let gettingSyncOption;

let managedOptions = null;
let syncOptions = null;

/**
 * Get the default value for a seting.
 *
 * Returns undefined, if option cannot be found.
 *
 * @function
 * @param  {string|null} option name of the option
 * @returns {Object|undefined}
 * @throws {Error} if option is not available
 */
export function getDefaultValue(option) {
    // return all default values
    if (!option) {
        return DEFAULT_SETTINGS;
    }

    // if undefined
    if (DEFAULT_SETTINGS.hasOwnProperty(option)) {
        return DEFAULT_SETTINGS[option];
    } else {
        Logger.logError(`Default value for option "${option}" missing. No default value defined.`);
        throw new Error(`Default value for option "${option}" missing. No default value defined.`);
    }
}

/**
 * Makes sure, that the synced o0ptions are available.
 *
 * @private
 * @function
 * @returns {Promise}
 * @throws {Error}
 */
function requireSyncedOptions() {
    return gettingSyncOption.catch(() => {
        // fatal error (already logged), as we now require synced options
        throw new Error("synced options not available");
    });
}

/**
 * Get all available options.
 *
 * It assumes gettingManagedOption is not pending anymore.
 *
 * @private
 * @function
 * @returns {Object}
 */
async function getAllOptions() {
    const result = {};

    // also need to wait for synced options
    await requireSyncedOptions();

    // if all values should be returned, also include all default ones in addition to fetched ones
    Object.assign(result, getDefaultValue());

    if (syncOptions !== null) {
        Object.assign(result, syncOptions);
    }

    if (managedOptions !== null) {
        Object.assign(result, managedOptions);
    }

    return result;
}

/**
 * Clears the stored/cached values.
 *
 * Usually you should not call this, but just reload the data with
 * {@link loadOptions()} in case you need this. Otherwise, this leaves the
 * module in an uninitalized/unexpected state.
 *
 * @function
 * @returns {void}
 */
export function clearCache() {
    managedOptions = null;
    syncOptions = null;
}

/**
 * Returns the add-on setting to use in add-on.
 *
 * If only a single option is requested (option=string) the result of the
 * promise will be that return value.
 * Otherwise, you can pass no parmeter or "null" and it will return all
 * saved config values.
 *
 * @function
 * @param  {string|null} [option=null] name of the option
 * @returns {Promise} resulting in single value or object of values or undefined
 * @throws {Error} if option is not available or other (internal) error happened
 */
export async function get(option = null) {
    let result = undefined;

    // verify managed options are loaded (or are not available)
    await gettingManagedOption.catch(() => {
        // ignore errors, as fallback to other storages is allowed
        // (although "no manifest" error is already handled)
    });

    // return all options
    if (option === null) {
        return getAllOptions();
    }

    // first try to get managed option
    if (managedOptions !== null && managedOptions.hasOwnProperty(option)) {
        result = managedOptions[option];
        Logger.logInfo(`Managed setting got for "${option}".`, result);
        return result;
    } else {
        await requireSyncedOptions();

        if (syncOptions !== null && syncOptions.hasOwnProperty(option)) {
            result = syncOptions[option];
            Logger.logInfo(`Synced setting got for "${option}".`, result);
            return result;
        }
    }

    // get default value as a last fallback
    result = getDefaultValue(option);

    // last fallback: default value
    Logger.logWarning(`Could not get option "${option}". Using default.`, result);

    return result;
}

/**
 * Sets the settings.
 *
 * Note you can pass an key -> value object to set here.
 *
 * @see {@link https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/StorageArea/set}
 * @function
 * @param  {Object|string} option keys/values to set or single value
 * @param  {Object} [value=] if only a single value is to be set
 * @returns {Promise}
 * @throws {TypeError}
 */
export function set(option, value) {
    // put params into object if needed
    if (!isObject(option)) {
        if (value === undefined) {
            return Promise.reject(new TypeError("Second argument 'value' has not been passed."));
        }

        option = {
            [option]: value
        };
    }

    return browser.storage.sync.set(option).then(() => {
        // syncOptions is only null, if loadOptions() -> gettingSyncOption has not yet been resolved
        // As such, we still have to save it already, as we do not want to introduce latency.
        if (syncOptions === null) {
            syncOptions = {};
        }

        // add to cache
        Object.assign(syncOptions, option);
    }).catch((error) => {
        Logger.logError("Could not save option:", option, error);

        // re-throw error to make user aware something failed
        throw error;
    });
}

/**
 * Fetches all options, so they can be used later.
 *
 * This is basically the init method!
 * It returns a promise, but that does not have to be used, because the module is
 * built in a way, so that the actual getting of the options is waiting for
 * the promise.
 *
 * @function
 * @returns {Promise}
 */
export function loadOptions() {
    if (browser.storage === undefined) {
        throw new Error("Storage API is not available.");
    }

    // clear storage first
    clearCache();

    // just fetch everything
    gettingManagedOption = browser.storage.managed.get().then((options) => {
        managedOptions = options;
    }).catch((error) => {
        // rethrow error if it is not just due to missing storage manifest
        if (error.message === "Managed storage manifest not found") {
            /* only log warning as that is expected when no manifest file is found */
            Logger.logWarning("could not get managed options", error);

            // This error is now handled.
            return;
        }

        throw error;
    });

    gettingSyncOption = browser.storage.sync.get().then((options) => {
        if (syncOptions === null) {
            syncOptions = options;
        } else {
            // In case set() is called before this Promise here resolves, we need to keep the old values, but prefer the newly set ones.
            Object.assign(options, syncOptions);
        }
    }).catch((error) => {
        Logger.logError("could not get sync options", error);

        // re-throw, so Promise is not marked as handled
        throw error;
    });

    // if the settings have been received anywhere, they could be loaded
    return gettingManagedOption.catch(() => gettingSyncOption);// //
}

// automatically fetch options
loadOptions().then(() => {
    Logger.logInfo("AddonSettings module loaded.");
});
