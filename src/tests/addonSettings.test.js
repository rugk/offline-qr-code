import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as AddonSettings from "/common/modules/AddonSettings.js";

import {FakeStorage} from "./modules/FakeStorage.js";

const storageMethods = ["get", "set", "remove", "clear"]; // getBytesInUse not yet implemented in Firefox

describe("common module: AddonSettings", function () {
    let managedStorage;
    let syncStorage;

    let storageStub = {};

    before(function () {
        // Mocked function needs to be accessed at least once to get initiated and not be just a getter/property.
        // Otherwise "TypeError: Attempted to wrap undefined property getUILanguage as functioncheckWrappedMethod" is shown.
        // See https://discourse.mozilla.org/t/webextension-apis-made-as-getter-setter-lazily-evaluating-to-functions-beware-of-mocking-for-unit-tests/30849

        /* eslint-disable no-unused-expressions */
        for (const call of storageMethods) {
            browser.storage.managed[call];
            browser.storage.sync[call];
        }
        /* eslint-enable no-unused-expressions */
    });

    beforeEach(function() {
        // Stubs the used storage APIs, so no actual data is saved/modified
        // permanently.
        managedStorage = new FakeStorage();
        syncStorage = new FakeStorage();

        storageStub.managed = {};
        storageStub.sync = {};

        for (const call of storageMethods) {
            const managedStub = sinon.stub(browser.storage.managed, call);
            storageStub.managed[call] = managedStub;
            managedStub.callsFake(managedStorage[call].bind(managedStorage));

            const syncStub = sinon.stub(browser.storage.sync, call);
            storageStub.sync[call] = syncStub;
            syncStub.callsFake(syncStorage[call].bind(syncStorage));
        }
    });

    afterEach(function() {
        sinon.restore();
        storageStub = {};
    });

    /**
     * Disabels the managed store, so
     *
     * @function
     * @returns {void}
     */
    function disableManagedStore() {
        storageStub.managed.get.throws("Error", "Managed storage manifest not found");
        storageStub.managed.set.throws("Error", "Error: storage.managed is read-only");
        storageStub.managed.remove.throws("Error", "Error: storage.managed is read-only");
        storageStub.managed.clear.throws("Error", "Error: storage.managed is read-only");
    }

    describe("loadOptions()", function () {
        it("loads managed options", function () {
            // unstub functions, we want to mock
            storageStub.managed.get.restore();

            const mockManaged = sinon.mock(browser.storage.managed);

            /* eslint-disable indent */
            mockManaged.expects("get")
                    .once().withArgs()
                    .resolves({});

            // ignore sync promise
            storageStub.sync.get.rejects(new Error("browser.storage.sync is supposed to reject"));

            const loadPromise = AddonSettings.loadOptions();

            // verify results
            mockManaged.verify();

            // verify promise is resolved eventually
            return loadPromise.catch((error) => {
                chai.assert.fail("reject", "succeed",
                    `loadPromise has been rejected, but was expected to succeed. Error: "${error}")`
                );
            });
        });

        it("loads sync options", function () {
            // unstub functions, we want to mock
            storageStub.sync.get.restore();

            const mockSync = sinon.mock(browser.storage.sync);

            /* eslint-disable indent */
            mockSync.expects("get")
                    .once().withArgs()
                    .resolves({});

            // ignore managed promise
            storageStub.managed.get.rejects(new Error("browser.storage.managed is supposed to reject"));

            const loadPromise = AddonSettings.loadOptions();

            // verify results
            mockSync.verify();

            // verify promise is resolved eventually
            return loadPromise.catch((error) => {
                chai.assert.fail("reject", "succeed",
                `loadPromise has been rejected, but was expected to succeed. Error: "${error}")`);
            });
        });

        it("loading fails if API or permission is not there", function () {
            // TODO: use custom error class?
            let lastStub;

            // simpulate missing "storage" permission
            lastStub = sinon.stub(browser, "storage").value(undefined);
            chai.assert.throws(AddonSettings.loadOptions, Error, "Storage API is not available.",
                "does not throw correctly when browser.storage === undefined.");

            lastStub.restore();
            // simpulate missing "managed" API
            lastStub = sinon.stub(browser.storage, "managed").value(undefined);
            chai.assert.throws(AddonSettings.loadOptions, Error, undefined,
                "does not throw correctly when browser.storage.managed === undefined.");

            lastStub.restore();
            // simpulate missing "sync" API
            sinon.stub(browser.storage, "sync").value(undefined);
            chai.assert.throws(AddonSettings.loadOptions, Error, undefined,
                "does not throw correctly when browser.storage.sync === undefined.");
        });
    });

    describe("get(string) – get value", function () {
        it("returns saved value in managed storage", async function () {
            // modify internal state of storage
            const savedValue = Symbol("exactlyThisValue in managed storage");
            managedStorage.internalStorage = {
                "exampleValue": savedValue
            };

            // need to load options
            AddonSettings.loadOptions();
            const value = await AddonSettings.get("exampleValue");

            // verify results
            chai.assert.strictEqual(value, savedValue);
        });

        it("returns saved value in sync storage", async function () {
            disableManagedStore();

            // modify internal state of storage
            const savedValue = Symbol("exactlyThisValue in sync storage");
            syncStorage.internalStorage = {
                "exampleValue": savedValue
            };

            // need to load options
            await AddonSettings.loadOptions();
            const value = await AddonSettings.get("exampleValue");

            // verify results
            chai.assert.strictEqual(value, savedValue);
        });

        it("returns default value", async function () {
            // need to load options
            await AddonSettings.loadOptions();
            const value = await AddonSettings.get("qrColor");

            // verify results
            chai.assert.strictEqual(value, "#0c0c0d");
        });

        it("returns default value if managed store is disabled", async function () {
            disableManagedStore();

            // need to load options
            await AddonSettings.loadOptions();
            const value = await AddonSettings.get("qrColor");

            // verify results
            chai.assert.strictEqual(value, "#0c0c0d");
        });

        it("prefers value in managed storage over default value", async function () {
            // modify internal state of storages
            const savedManagedValue = "#00ff00";
            managedStorage.internalStorage = {
                "qrColor": savedManagedValue
            };

            // need to load options
            await AddonSettings.loadOptions();
            const value = await AddonSettings.get("qrColor");

            // verify results
            chai.assert.strictEqual(value, savedManagedValue);
        });

        it("prefers value in managed sync over default value", async function () {
            // modify internal state of storages
            const savedSyncedValue = "#00ff00";
            syncStorage.internalStorage = {
                "qrColor": savedSyncedValue
            };

            // need to load options
            await AddonSettings.loadOptions();
            const value = await AddonSettings.get("qrColor");

            // verify results
            chai.assert.strictEqual(value, savedSyncedValue);
        });

        it("prefers value in managed storage over value in sync storage", async function () {
            // modify internal state of storages
            const savedManagedValue = Symbol("exactlyThisValue in managed storage");
            managedStorage.internalStorage = {
                "examplePreferValue": savedManagedValue
            };

            const savedSyncValue = Symbol("exactlyThisValue in sync storage");
            syncStorage.internalStorage = {
                "examplePreferValue": savedSyncValue
            };

            // need to load options
            await AddonSettings.loadOptions();
            const value = await AddonSettings.get("examplePreferValue");

            // verify results
            chai.assert.strictEqual(value, savedManagedValue);
        });
    });

    describe("get(null)", function () {
        it("returns all saved values in managed storage", async function () {
            // modify internal state of storage
            const savedStorage = {
                "one": Symbol("someValue"),
                "two": 1234,
                "three": {
                    "anObject": "great!",
                    "okay": Symbol("ifYouLikeIt"),
                },
            };
            managedStorage.internalStorage = savedStorage;

            // need to load options
            AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            // verify results (includes default values)
            chai.assert.deepNestedInclude(options, savedStorage);
        });

        it("returns all saved values in sync storage", async function () {
            disableManagedStore();

            // modify internal state of storage
            const savedStorage = {
                "one": Symbol("someValue"),
                "two": 1234,
                "three": {
                    "anObject": "great!",
                    "okay": Symbol("ifYouLikeIt"),
                },
            };
            syncStorage.internalStorage = savedStorage;

            // need to load options
            AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            // verify results (includes default values)
            chai.assert.deepNestedInclude(options, savedStorage);
        });

        it("returns default values when managed storage is used and empty", async function () {
            // need to load options
            AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            // just verify two default values to not need to hardcode them here again
            chai.assert.deepNestedInclude(options, {
                qrColor: "#0c0c0d",
                qrBackgroundColor: "#ffffff"
            });
        });

        it("returns default values when sync storage is used and empty", async function () {
            disableManagedStore();

            // need to load options
            AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            // just verify two default values to not need to hardcode them here again
            chai.assert.deepNestedInclude(options, {
                qrColor: "#0c0c0d",
                qrBackgroundColor: "#ffffff"
            });
        });

        it("combines managed storage and default values, preferring the first", async function () {
            // modify internal state of storage
            const savedStorage = {
                qrColor: "#0000ff",
            };
            managedStorage.internalStorage = savedStorage;

            // need to load options
            AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            chai.assert.containsAllKeys(
                options,
                savedStorage,
                "does not include all keys from managed store"
            );
            chai.assert.containsAllKeys(
                options,
                {
                    qrColor: "#0c0c0d",
                    qrBackgroundColor: "#ffffff"
                },
                "does not include keys from default values"
            );

            // prefers saved value
            chai.assert.strictEqual(
                options.qrColor,
                savedStorage.qrColor,
                "did not prefer managed stored value over default stored value"
            );
        });

        it("combines synced storage and default values, preferring the first", async function () {
            disableManagedStore();

            // modify internal state of storage
            const savedStorage = {
                qrColor: "#0000ff",
            };
            syncStorage.internalStorage = savedStorage;

            // need to load options
            AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            chai.assert.containsAllKeys(
                options,
                savedStorage,
                "does not include all keys from sync store"
            );
            chai.assert.containsAllKeys(
                options,
                {
                    qrColor: "#0c0c0d",
                    qrBackgroundColor: "#ffffff"
                },
                "does not include keys from default values"
            );

            // prefers saved value
            chai.assert.strictEqual(
                options.qrColor,
                savedStorage.qrColor,
                "did not prefer synced stored value over default stored value"
            );
        });

        it("combines all values in managed storage and values in sync storage, prefering the first", async function () {
            // modify internal state of storages
            const savedManagedValues = {
                "one": Symbol("managedOne"),
                "singleManagedValue": Symbol("only in managed store"),
                "settingsObject": {
                    "storedIn": "managed",
                    "okay": Symbol("ifYouLikeIt"),
                },
            };
            managedStorage.internalStorage = savedManagedValues;

            const savedSyncedValues = {
                "one": Symbol("syncOne"),
                "singleSyncValue": Symbol("only in sync store"),
                "settingsObject": {
                    "storedIn": "synced",
                    "okay": Symbol("ifYouLikeIt"),
                },
            };
            syncStorage.internalStorage = savedSyncedValues;

            // need to load options
            await AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            // verify that both values are included
            chai.assert.containsAllKeys(
                options,
                savedManagedValues,
                "does not include all values from managed store"
            );
            chai.assert.containsAllKeys(
                options,
                savedSyncedValues,
                "does not include all values from sync store"
            );

            // verify it prefers the managed one
            chai.assert.strictEqual(
                options.one,
                savedManagedValues.one,
                "did not prefer managed store value over synced store value"
            );

            // currently it does not deep merge an object, so it should prefer
            // the managed object
            chai.assert.deepEqual(
                options.settingsObject,
                savedManagedValues.settingsObject,
                "did not prefer managed store value over synced store value in object"
            );
        });

        it("combines all managed, synced and default values on this order of preference", async function () {
            // modify internal state of storages
            const savedManagedValues = {
                "comparsion": Symbol("managedOne"),
                "managedStoreIncluded": true,
            };
            managedStorage.internalStorage = savedManagedValues;

            const savedSyncedValues = {
                "comparsion": Symbol("syncedOne"),
                "syncedStoreIncluded": true,
            };
            syncStorage.internalStorage = savedSyncedValues;

            // need to load options
            await AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            // verify that both values are included
            chai.assert.containsAllKeys(
                options,
                savedManagedValues,
                "does not include all values from managed store"
            );
            chai.assert.containsAllKeys(
                options,
                savedSyncedValues,
                "does not include all values from sync store"
            );
            chai.assert.containsAllKeys(
                options,
                {
                    qrColor: "#0c0c0d",
                    qrBackgroundColor: "#ffffff"
                },
                "does not include values from default store"
            );

            // verify it prefers the managed one
            chai.assert.strictEqual(
                options.comparsion,
                savedManagedValues.comparsion,
                "did not prefer managed store over all others"
            );
        });

        describe("get(…) – failures", function () {
            /**
             * Tests, if the .get() function correctly throws when sync storage
             * not available anymore.
             *
             * @returns {void}
             */
            function testThrowsSyncNotAvailable() {
                // remove sync API
                storageStub.sync.get.rejects(new Error("expected test error"));

                // need to load options
                AddonSettings.loadOptions();

                // verify case, where one values is requested
                const promiseGetValue = AddonSettings.get("exampleValue").then((value) => {
                    chai.assert.fail("succeed", "reject",
                        `AddonSettings.get(exampleValue) has been succeed, but was expected to reject. Return value: "${value}")`);
                }).catch((error) => {
                    if (error instanceof Error && error.message === "synced options not available") {
                        // expected to throw/reject this, so ignore error
                        return;
                    }

                    throw error;
                });

                // verify case, where all values are requested
                const promiseGetAll = AddonSettings.get().then((value) => {
                    chai.assert.fail(value, "reject",
                        `AddonSettings.get() has been succeed, but was expected to reject. Return value: "${value}")`);
                }).catch((error) => {
                    if (error instanceof Error && error.message === "synced options not available") {
                        // expected to throw/reject this, so ignore error
                        return;
                    }

                    throw error;
                });

                return Promise.all([promiseGetValue, promiseGetAll]);
            }

            it("throws, if sync store is not available", function () {
                testThrowsSyncNotAvailable();
            });

            it("throws, if sync and managed storage are not available", function () {
                disableManagedStore();

                testThrowsSyncNotAvailable();
            });

            it("throws, if non-existant value without default is requested", function () {
                // need to load options
                AddonSettings.loadOptions();

                return AddonSettings.get("exampleValue").then((value) => {
                    chai.assert.fail("succeed", "reject",
                        `AddonSettings.get(exampleValue) has been succeed, but was expected to reject. Return value: "${value}")`);
                }).catch((error) => {
                    if (error instanceof Error && error.message === "Could not get option \"exampleValue\". No default value defined.") {
                        // expected to throw/reject this, so ignore error
                        return;
                    }

                    throw error;
                });
            });
        });
    });

    describe("set()", function () {
    });

    describe("get() – cache usage", function () {
    });
});
