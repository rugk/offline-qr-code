import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as AddonSettings from "/common/modules/AddonSettings.js";

// import * as FakeStorage from "./FakeStorage.js";

describe("common module: AddonSettings", function () {
    let managedStorage;
    let syncStorage;

    beforeEach(function() {
        // managedStorage = new FakeStorage();
        // syncStorage = new FakeStorage();
        //
        // const fakeManaged = sinon.fake(managedStorage);
        // const fakeSync = sinon.fake(syncStorage);

        // sinon.replace(browser.storage, "managed", fakeManaged);
        // sinon.replace(browser.storage, "sync", fakeSync);
    });
    afterEach(function() {
        sinon.restore();
    });

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
