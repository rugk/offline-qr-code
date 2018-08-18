import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as AddonSettings from "/common/modules/AddonSettings.js";

import * as AddonSettingsStub from "./modules/AddonSettingsStub.js";
import {wait} from "./modules/PromiseHelper.js";

/**
 * Safely returns the string representation of the value.
 *
 * @function
 * @param {Object} value any value
 * @returns {void}
 */
function valueToString(value) {
    if (typeof value === "symbol") {
        return value.toString();
    }

    return value;
}

describe("common module: AddonSettings", function () {
    before(function () {
        AddonSettingsStub.before();
    });

    beforeEach(function() {
        AddonSettingsStub.stubAllStorageApis();
    });

    afterEach(function() {
        sinon.restore();
        AddonSettingsStub.afterTest();
    });

    describe("loadOptions()", function () {
        it("loads managed options", function () {
            // unstub functions, we want to mock
            AddonSettingsStub.stubs.managed.get.restore();

            const mockManaged = sinon.mock(browser.storage.managed);

            /* eslint-disable indent */
            mockManaged.expects("get")
                    .once().withArgs()
                    .resolves({});

            // ignore sync promise
            AddonSettingsStub.stubs.sync.get.rejects(new Error("browser.storage.sync is supposed to reject"));

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
            AddonSettingsStub.stubs.sync.get.restore();

            const mockSync = sinon.mock(browser.storage.sync);

            /* eslint-disable indent */
            mockSync.expects("get")
                    .once().withArgs()
                    .resolves({});

            // ignore managed promise
            AddonSettingsStub.stubs.managed.get.rejects(new Error("browser.storage.managed is supposed to reject"));

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
            AddonSettingsStub.managedStorage.internalStorage = {
                "exampleValue": savedValue
            };

            // need to load options
            AddonSettings.loadOptions();
            const value = await AddonSettings.get("exampleValue");

            // verify results
            chai.assert.strictEqual(value, savedValue);
        });

        it("returns saved value in sync storage", async function () {
            // modify internal state of storage
            const savedValue = Symbol("exactlyThisValue in sync storage");
            AddonSettingsStub.syncStorage.internalStorage = {
                "exampleValue": savedValue
            };

            // need to load options
            await AddonSettings.loadOptions();
            const value = await AddonSettings.get("exampleValue");

            // verify results
            chai.assert.strictEqual(value, savedValue);
        });

        it("returns saved value in sync storage if managed storage is disabled", async function () {
            AddonSettingsStub.disableManagedStore();

            // modify internal state of storage
            const savedValue = Symbol("exactlyThisValue in sync storage");
            AddonSettingsStub.syncStorage.internalStorage = {
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

        it("returns default value if managed storage is disabled", async function () {
            AddonSettingsStub.disableManagedStore();

            // need to load options
            await AddonSettings.loadOptions();
            const value = await AddonSettings.get("qrColor");

            // verify results
            chai.assert.strictEqual(value, "#0c0c0d");
        });

        it("prefers value in managed storage over default value", async function () {
            // modify internal state of storages
            const savedManagedValue = "#00ff00";
            AddonSettingsStub.managedStorage.internalStorage = {
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
            AddonSettingsStub.syncStorage.internalStorage = {
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
            AddonSettingsStub.managedStorage.internalStorage = {
                "examplePreferValue": savedManagedValue
            };

            const savedSyncValue = Symbol("exactlyThisValue in sync storage");
            AddonSettingsStub.syncStorage.internalStorage = {
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
            AddonSettingsStub.managedStorage.internalStorage = savedStorage;

            // need to load options
            AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            // verify results (includes default values)
            chai.assert.deepNestedInclude(options, savedStorage);
        });

        it("returns all saved values in sync storage", async function () {
            AddonSettingsStub.disableManagedStore();

            // modify internal state of storage
            const savedStorage = {
                "one": Symbol("someValue"),
                "two": 1234,
                "three": {
                    "anObject": "great!",
                    "okay": Symbol("ifYouLikeIt"),
                },
            };
            AddonSettingsStub.syncStorage.internalStorage = savedStorage;

            // need to load options
            AddonSettings.loadOptions();
            const options = await AddonSettings.get();

            // verify results (includes default values)
            chai.assert.deepNestedInclude(options, savedStorage);
        });

        it("returns default values when managed and sync storage is used and empty", async function () {
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
            AddonSettingsStub.disableManagedStore();

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
            AddonSettingsStub.managedStorage.internalStorage = savedStorage;

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
            AddonSettingsStub.disableManagedStore();

            // modify internal state of storage
            const savedStorage = {
                qrColor: "#0000ff",
            };
            AddonSettingsStub.syncStorage.internalStorage = savedStorage;

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
            AddonSettingsStub.managedStorage.internalStorage = savedManagedValues;

            const savedSyncedValues = {
                "one": Symbol("syncOne"),
                "singleSyncValue": Symbol("only in sync store"),
                "settingsObject": {
                    "storedIn": "synced",
                    "okay": Symbol("ifYouLikeIt"),
                },
            };
            AddonSettingsStub.syncStorage.internalStorage = savedSyncedValues;

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
            AddonSettingsStub.managedStorage.internalStorage = savedManagedValues;

            const savedSyncedValues = {
                "comparsion": Symbol("syncedOne"),
                "syncedStoreIncluded": true,
            };
            AddonSettingsStub.syncStorage.internalStorage = savedSyncedValues;

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
            AddonSettingsStub.stubs.sync.get.rejects(new Error("expected test error"));

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
            AddonSettingsStub.disableManagedStore();

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

    describe("set()", function () {
        const TEST_VALUES = [
            Symbol("exactlyThisNewValue"), // eslint-disable-line mocha/no-setup-in-describe
            "anString",
            1234,
            {
                name: "a test object",
                id: Symbol("idValue") // eslint-disable-line mocha/no-setup-in-describe
            },
            true,
            false,
            null
        ];

        beforeEach(function() {
            // (re)load options in order to load the new (clean) ones
            return AddonSettings.loadOptions();
        });

        it("saves value in sync storage passed as single value", async function () {
            let i = 0;
            for (const valueToSave of TEST_VALUES) {
                i++;
                const key = `exampleValue${i}`;

                const objectItShouldSave = {
                    [key]: valueToSave
                };

                // clear options & (re)load them in order to clear them
                AddonSettingsStub.syncStorage.internalStorage = {};
                await AddonSettings.loadOptions();

                await AddonSettings.set(key, valueToSave).catch((error) => {
                    chai.assert.fail(`reject: ${error}`, "succeed",
                        `AddonSettings.set(key, valueToSave) has been rejected, but was expected to succeed while saving "${valueToString(valueToSave)}". Error: "${error}")`
                    );
                });

                // verify results
                chai.assert.deepEqual(
                    AddonSettingsStub.syncStorage.internalStorage,
                    objectItShouldSave,
                    `Could not save value "${valueToString(valueToSave)}".`
                );

                // verify save API was correctly called
                sinon.assert.callCount(AddonSettingsStub.stubs.sync.set, i);
                sinon.assert.calledWith(AddonSettingsStub.stubs.sync.set, objectItShouldSave);
            }
        });

        it("saves value in sync storage when passed as object", async function () {
            let i = 0;
            // test for all TEST_VALUES + undefined
            for (const valueToSave of [...TEST_VALUES, undefined]) {
                i++;
                const key = `exampleValue${i}`;

                const objectToSave = {
                    [key]: valueToSave
                };

                // clear options & (re)load them in order to clear them
                AddonSettingsStub.syncStorage.internalStorage = {};
                await AddonSettings.loadOptions();

                await AddonSettings.set(objectToSave).catch((error) => {
                    chai.assert.fail(`reject: ${error}`, "succeed",
                        `AddonSettings.set(objectToSave) has been rejected, but was expected to succeed while saving "${valueToString(valueToSave)}". Error: "${error}")`
                    );
                });

                // verify results
                chai.assert.deepEqual(
                    AddonSettingsStub.syncStorage.internalStorage,
                    objectToSave,
                    `Could not save value "${valueToString(valueToSave)}".`
                );

                // verify save API was correctly called
                sinon.assert.callCount(AddonSettingsStub.stubs.sync.set, i);
                sinon.assert.calledWith(AddonSettingsStub.stubs.sync.set, objectToSave);
            }
        });

        it("overrides old values", async function () {
            let i = 0;
            for (const valueToSave of TEST_VALUES) {
                i++;
                const key = "testKey";

                const objectItShouldSave = {
                    [key]: valueToSave
                };

                // pre-set storage
                AddonSettingsStub.syncStorage.internalStorage = {
                    [key]: Symbol("veryOldValue")
                };
                await AddonSettings.loadOptions();

                await AddonSettings.set(key, valueToSave).catch((error) => {
                    chai.assert.fail(`reject: ${error}`, "succeed",
                        `AddonSettings.set(key, valueToSave) has been rejected, but was expected to succeed while saving "${valueToString(valueToSave)}". Error: "${error}")`
                    );
                });

                // verify results
                chai.assert.deepEqual(
                    AddonSettingsStub.syncStorage.internalStorage,
                    objectItShouldSave,
                    `Could not save value "${valueToString(valueToSave)}".`
                );

                // verify save API was correctly called
                sinon.assert.callCount(AddonSettingsStub.stubs.sync.set, i);
                sinon.assert.calledWith(AddonSettingsStub.stubs.sync.set, objectItShouldSave);
            }
        });

        it("adds new values", async function () {
            const testObject = {};

            let i = 0;
            for (const valueToSave of TEST_VALUES) {
                i++;
                const key = `newKey #${i}`;

                Object.assign(testObject, {
                    [key]: valueToSave
                });

                await AddonSettings.set(key, valueToSave).catch((error) => {
                    chai.assert.fail(`reject: ${error}`, "succeed",
                        `AddonSettings.set(key, valueToSave) has been rejected, but was expected to succeed while saving "${valueToString(valueToSave)}". Error: "${error}")`
                    );
                });

                // verify results
                chai.assert.deepEqual(
                    AddonSettingsStub.syncStorage.internalStorage,
                    testObject,
                    `Invalid internal storage state after saving "${valueToString(valueToSave)}".`
                );
            }
        });

        it("throws if it could not save value", async function () {
            // remove sync API
            AddonSettingsStub.stubs.sync.set.rejects(new Error("expected test error: sync API not there"));

            const key = "climbThatMountain";
            const valueToSave = Symbol("ledgitValue");

            await AddonSettings.set(key, valueToSave).then((value) => {
                chai.assert.fail("succeed", "reject",
                    `AddonSettings.set(key, valueToSave) has been succeed, but was expected to reject. Return value: "${value}")`);
            }).catch((error) => {
                if (error instanceof Error && error.message === "expected test error: sync API not there") {
                    // expected to throw/reject this, so ignore error
                    return;
                }

                throw error;
            });

            // verify results
            chai.assert.isEmpty(AddonSettingsStub.syncStorage.internalStorage);
        });

        it("throws if incorrectly called .set(<string>) without second argument", async function () {
            const key = "noSecondArgument";

            await AddonSettings.set(key).then((value) => {
                chai.assert.fail("succeed", "reject",
                    `AddonSettings.set(key) has been succeed, but was expected to reject. Return value: "${value}")`);
            }).catch((error) => {
                if (error instanceof TypeError && error.message === "Second argument 'value' has not been passed.") {
                    // expected to throw/reject this, so ignore error
                    return;
                }

                throw error;
            });

            // verify results
            chai.assert.isEmpty(AddonSettingsStub.syncStorage.internalStorage);
        });
    });

    describe("getDefaultValue()", function () {
        it("returns default value", async function () {
            // there should no need to load the options before doing the test
            // await AddonSettings.loadOptions();

            const value = await AddonSettings.getDefaultValue("qrColor");

            // verify results
            chai.assert.strictEqual(value, "#0c0c0d");
        });

        it("returns all default values", async function () {
            // there should no need to load the options before doing the test
            // await AddonSettings.loadOptions();

            const options = await AddonSettings.getDefaultValue();

            // just verify two default values to not need to hardcode them here again
            chai.assert.deepNestedInclude(options, {
                qrColor: "#0c0c0d",
                qrBackgroundColor: "#ffffff"
            });
        });
    });

    describe("get() – cache usage", function () {
        it("loads managed storage values only once into cache", async function () {
            const oldValue = Symbol("old");

            AddonSettingsStub.managedStorage.internalStorage = {
                "cachedData": oldValue
            };

            // reload options
            await AddonSettings.loadOptions();

            // modify state of underlying storage
            AddonSettingsStub.managedStorage.internalStorage = {
                "cachedData": Symbol("newFakeOne"),
                "hasFakeData": true,
            };

            const value = await AddonSettings.get("cachedData");

            // verify it still has the old one
            chai.assert.strictEqual(
                value,
                oldValue,
                "did not correctly cache old value"
            );

            const options = await AddonSettings.get();
            chai.assert.notInclude(
                options,
                {"hasFakeData": true},
                "did incorrectly include value of not cached new value"
            );

            // verify get was only called once, i.e. all values were only loaded once
            sinon.assert.calledOnce(AddonSettingsStub.stubs.managed.get);
        });

        it("returns last cached value when preset before loading", async function () {
            AddonSettingsStub.disableManagedStore();

            const oldValue = Symbol("old");

            AddonSettingsStub.syncStorage.internalStorage = {
                "cachedData": oldValue
            };

            // reload options
            await AddonSettings.loadOptions();

            // modify state of underlying storage
            AddonSettingsStub.syncStorage.internalStorage = {
                "cachedData": Symbol("newFakeOne"),
                "hasFakeData": true,
            };

            const value = await AddonSettings.get("cachedData");

            // verify it still has the old one
            chai.assert.strictEqual(
                value,
                oldValue,
                "did not correctly cache old value"
            );

            const options = await AddonSettings.get();
            chai.assert.notInclude(
                options,
                {"hasFakeData": true},
                "did incorrectly include value of not cached new value"
            );

            // verify get was only called once, i.e. all values were only loaded once
            sinon.assert.calledOnce(AddonSettingsStub.stubs.sync.get);
        });

        it("returns last cached value when manually set", async function () {
            AddonSettingsStub.disableManagedStore();

            const oldValue = Symbol("old");

            await AddonSettings.set({
                "cachedData": oldValue
            });

            // modify state of underlying storage
            AddonSettingsStub.syncStorage.internalStorage = {
                "cachedData": Symbol("newFakeOne"),
                "hasFakeData": true,
            };

            const value = await AddonSettings.get("cachedData");

            // verify it still has the old one
            chai.assert.strictEqual(
                value,
                oldValue,
                "did not correctly cache old value"
            );

            const options = await AddonSettings.get();
            chai.assert.notInclude(
                options,
                {"hasFakeData": true},
                "did incorrectly include value of not cached new value"
            );

            // verify get was not called in this test, i.e. data was not reloaded (called before once during loading)
            sinon.assert.notCalled(AddonSettingsStub.stubs.sync.get);
        });

        it("returns newly set value from cache", async function () {
            AddonSettingsStub.disableManagedStore();

            const oldValue = Symbol("old cached value");
            const newValue = Symbol("new value");

            await AddonSettings.set({
                "cachedData": oldValue
            });

            await AddonSettings.set({
                "cachedData": newValue,
                "hasNewCachedValue": true
            });

            const options = await AddonSettings.get();

            // verify it now has the new one
            chai.assert.include(
                options,
                { "hasNewCachedValue": true },
                "did not correctly add newly set value into cache"
            );

            chai.assert.strictEqual(
                options.cachedData,
                newValue,
                "did not correctly invalidate old cached value"
            );
        });
    });

    describe("get() – asyncronous actions", function () {
        before(function() {
            sinon.addBehavior("delayAndResolve", ((fake, delayTimeInMs, resolveValue) => {
                fake.callsFake(() => wait(delayTimeInMs, resolveValue));
            }));
        });

        /**
         * Tests, that the get() function waits for the storage API before (trying to return) any values.
         *
         * Note we cannot use sinon's fake timer here, as we need to use the real asyncronity of JS and need
         * some delay to
         *
         * @function
         * @param {AddonSettingsStub.stubs.managed.get|AddonSettingsStub.stubs.sync.get} storageStubGet
         * @returns {Promise}
         */
        async function testWaitPromises(storageStubGet) {
            const singleValue = Symbol("preloaded");
            const allOptions = {
                "qrColor": singleValue
            };
            const promiseArray = [];

            storageStubGet
                .withArgs().delayAndResolve(15, allOptions)
                .withArgs("qrColor").delayAndResolve(15, singleValue);

            promiseArray.push(AddonSettings.loadOptions());

            // test getting a single value
            let loadedSingleValue = null;
            promiseArray.push(AddonSettings.get("qrColor").then((value) => {
                loadedSingleValue = value;
            }));

            // test getting all values
            let loadedOptions = {};
            promiseArray.push(AddonSettings.get().then((value) => {
                loadedOptions = value;
            }));

            // verify no data is there yet
            await wait(5);

            chai.assert.notStrictEqual(loadedSingleValue, singleValue, "AddonSettings.get(testValue): Data for single value is prematurely available.");
            chai.assert.notInclude(loadedOptions, allOptions, "AddonSettings.get(): Data for all values is prematurely available.");

            // verify it also did not return default (and thus wrong) value
            chai.assert.notStrictEqual(loadedSingleValue, "#0c0c0d", "AddonSettings.get(testValue): Data for single value has been prematurely returned as default (incorrect) value.");
            chai.assert.notInclude(loadedOptions, { "qrColor": "#0c0c0d" }, "AddonSettings.get(): Data for all values has been prematurely returned as default (incorrect) value.");

            // let promise resolve, so give enough time to also let values to be set by .then() clauses
            await wait(15);

            // verify data has now been loaded
            chai.assert.strictEqual(loadedSingleValue, singleValue, "AddonSettings.get(testValue): Data for single value is still not available after Promise is resolved.");
            chai.assert.include(loadedOptions, allOptions, "AddonSettings.get(): Data for all values is still not available after Promise is resolved.");

            return Promise.all(promiseArray);
        }

        it("waits for managed storage", function () {
            return testWaitPromises(AddonSettingsStub.stubs.managed.get);
        });

        it("waits for sync storage", function () {
            return testWaitPromises(AddonSettingsStub.stubs.sync.get);
        });

        it("waits for sync storage with managed storage disabled", function () {
            AddonSettingsStub.disableManagedStore();

            return testWaitPromises(AddonSettingsStub.stubs.sync.get);
        });

        it("combines prematurely set values set when browser.sync.get() loads very late", async function () {
            const oldValue = Symbol("old value");
            const oldOptions = {
                "testValue": oldValue
            };

            AddonSettingsStub.stubs.sync.get
                .withArgs().delayAndResolve(5, oldOptions)
                .withArgs("testValue").delayAndResolve(5, oldValue);

            const loadSettings = AddonSettings.loadOptions();

            // set value (in cache) while options are still loading
            const newValue = Symbol("overwritten value");
            const newOptions = {
                "testValue": newValue,
                "hasNewValue": true
            };
            AddonSettings.set(newOptions);

            // test getting all values
            const options = await AddonSettings.get();

            // verify it now has the new one
            chai.assert.include(
                options,
                { "hasNewValue": true },
                "did not correctly add newly set value"
            );

            chai.assert.strictEqual(
                options.testValue,
                newValue,
                "did not correctly replace old cached value"
            );

            // not really needed, as this Promise is very likely already resolved, but better safe than sorry
            return loadSettings;
        });
    });
});
