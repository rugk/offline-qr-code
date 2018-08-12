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
            storageStub.managed[call] = sinon.stub(browser.storage.managed, call).callsFake(managedStorage[call]);
            storageStub.sync[call] = sinon.stub(browser.storage.sync, call).callsFake(syncStorage[call]);
        }
    });

    afterEach(function() {
        sinon.restore();
        storageStub = {};
    });

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
            storageStub.sync.get.rejects("browser.storage.sync is supposed to reject");

            const loadPromise = AddonSettings.loadOptions();

            // verify results
            mockManaged.verify();

            // verify promise is resolved eventually
            return loadPromise.catch((error) => {
                chai.assert.fail("reject", "succeed",
                `loadPromise has been rejected, but was expected to succeed. Error: "${error}")`);
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
            storageStub.managed.get.rejects("browser.storage.managed is supposed to reject");

            const loadPromise = AddonSettings.loadOptions();

            // verify results
            mockSync.verify();

            // verify promise is resolved eventually
            return loadPromise.catch((error) => {
                chai.assert.fail("reject", "succeed",
                `loadPromise has been rejected, but was expected to succeed. Error: "${error}")`);
            });
        });
    });

    describe("get()", function () {
    });

    describe("set()", function () {
    });

    describe("get() – cache usage", function () {
    });
});
