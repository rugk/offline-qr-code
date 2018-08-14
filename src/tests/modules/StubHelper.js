import * as AddonSettings from "/common/modules/AddonSettings.js";

/**
 * Stubs the settings given to it.
 *
 * Due to the way AddonSettings is constructed, you do not need to await the
 * returned promise.
 *
 * @function
 * @param {Object} settingsObject
 * @returns {Promise}
 */
export function stubSettings(settingsObject) {
    // as we cannot stub ES6 modules, we need to stub the underlying settings API
    sinon.stub(browser.storage.sync, "get").resolves(settingsObject);

    // purge cache
    return AddonSettings.loadOptions();
};
