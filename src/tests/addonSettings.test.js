import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as AddonSettings from "/common/modules/AddonSettings.js";

import {FakeStorage} from "./modules/FakeStorage.js";

const storageMethods = ["get", "set", "remove", "clear"]; // getBytesInUse not yet implemented in Firefox

describe("common module: AddonSettings", function () {
    let managedStorage;
    let syncStorage;

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

    afterEach(function() {
        sinon.restore();
    });

    /**
     * Stubs the used storage APIs, so no actual data is saved/modified
     * permanently.
     *
     * @function
     * @private
     * @returns {void}
     */
    function stubStorages() {
        managedStorage = new FakeStorage();
        syncStorage = new FakeStorage();

        for (const call of storageMethods) {
            sinon.replace(browser.storage.managed, call, sinon.fake(managedStorage[call]));
            sinon.replace(browser.storage.sync, call, sinon.fake(syncStorage[call]));
        }
    }

    describe("loadOptions()", function () {
        it("loads managed options", function () {
            const mockManaged = sinon.mock(browser.storage.managed);

            /* eslint-disable indent */
            mockManaged.expects("get")
                    .once().withArgs()
                    .resolves({});

            // ignore sync promise
            sinon.stub(browser.storage.sync, "get").rejects("browser.storage.sync is supposed to reject");

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
            const mockSync = sinon.mock(browser.storage.sync);

            /* eslint-disable indent */
            mockSync.expects("get")
                    .once().withArgs()
                    .resolves({});

            // ignore managed promise
            sinon.stub(browser.storage.managed, "get").rejects("browser.storage.managed is supposed to reject");

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
