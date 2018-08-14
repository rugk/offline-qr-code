import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as AddonSettings from "/common/modules/AddonSettings.js";

/**
 * Disables the managed store, so it does not interfere when you test the
 * other storeage or so.
 *
 * @private
 * @function
 * @returns {void}
 */
function disableManagedStore() {
    sinon.stub(browser.storage.managed, "get").rejects(new Error("Managed storage manifest not found"));
    sinon.stub(browser.storage.managed, "set").rejects(new Error("storage.managed is read-only"));
    sinon.stub(browser.storage.managed, "remove").rejects(new Error("storage.managed is read-only"));
    sinon.stub(browser.storage.managed, "clear").rejects(new Error("storage.managed is read-only"));
}

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
    disableManagedStore();

    // as we cannot stub ES6 modules, we need to stub the underlying settings API
    sinon.stub(browser.storage.sync, "get").resolves(settingsObject);

    // purge cache
    return AddonSettings.loadOptions();
};
