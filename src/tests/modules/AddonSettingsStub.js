import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as AddonSettings from "/common/modules/AddonSettings.js";

import {FakeStorage} from "./FakeStorage.js";

export let managedStorage;
export let syncStorage;

export let stubs = {};

const storageMethods = ["get", "set", "remove", "clear"]; // getBytesInUse not yet implemented in Firefox

/**
 * Place into the "before" hook. Only needs to be executed once.
 *
 * @private
 * @function
 * @returns {void}
 */
export function before() {
    // Mocked function needs to be accessed at least once to get initiated and not be just a getter/property.
    // Otherwise "TypeError: Attempted to wrap undefined property getUILanguage as functioncheckWrappedMethod" is shown.
    // See https://discourse.mozilla.org/t/webextension-apis-made-as-getter-setter-lazily-evaluating-to-functions-beware-of-mocking-for-unit-tests/30849

    /* eslint-disable no-unused-expressions */
    for (const call of storageMethods) {
        browser.storage.managed[call];
        browser.storage.sync[call];
    }
    /* eslint-enable no-unused-expressions */
}

/**
 * Place into the "afterEach" hook, when test is done.
 *
 * ATTENTION: Do not forget sinon.restore() at the end of the test.
 *
 * @private
 * @function
 * @returns {void}
 */
export function afterTest() {
    stubs = {};

    // clean storages, so if test afterwards does not use mock, reset behaviour
    managedStorage.internalStorage = {};
    syncStorage.internalStorage = {};

    // purge cache
    AddonSettings.clearCache();
}

/**
 * Disables the managed store, so it does not interfere when you test the
 * other storeage or so.
 *
 * @function
 * @returns {void}
 */
export function disableManagedStore() {
    stubs.managed.get.rejects(new Error("Managed storage manifest not found"));
    stubs.managed.set.rejects(new Error("storage.managed is read-only"));
    stubs.managed.remove.rejects(new Error("storage.managed is read-only"));
    stubs.managed.clear.rejects(new Error("storage.managed is read-only"));
}

/**
 * Stubs the APIs used for storing add-on settings.
 *
 * This **must be** called if you want to use the other functions. Thus, best
 * do it in beforeEach or so.
 *
 * @function
 * @returns {void}
 */
export function stubAllStorageApis() {
    // Stubs the used storage APIs, so no actual data is saved/modified
    // permanently.
    managedStorage = new FakeStorage();
    syncStorage = new FakeStorage();

    stubs.managed = {};
    stubs.sync = {};

    for (const call of storageMethods) {
        const managedStub = sinon.stub(browser.storage.managed, call);
        stubs.managed[call] = managedStub;
        managedStub.callsFake(managedStorage[call].bind(managedStorage));

        const syncStub = sinon.stub(browser.storage.sync, call);
        stubs.sync[call] = syncStub;
        syncStub.callsFake(syncStorage[call].bind(syncStorage));
    }
}

/**
 * Stubs the settings given to it.
 *
 * Due to the way the AddonSettings module is constructed, you do not need to await the
 * returned promise.
 *
 * @function
 * @param {Object} settingsObject
 * @returns {Promise}
 */
export function stubSettings(settingsObject) {
    disableManagedStore();

    // as we cannot stub ES6 modules, we need to stub the underlying settings API
    syncStorage.internalStorage = settingsObject;

    // purge cache
    return AddonSettings.loadOptions();
}
