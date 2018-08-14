import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as IconHandler from "/common/modules/IconHandler.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";

describe("common module: IconHandler", function () {
    before(function () {
        // Mocked function needs to be accessed at least once to get initiated and not be just a getter/property.
        // Otherwise "TypeError: Attempted to wrap undefined property getUILanguage as functioncheckWrappedMethod" is shown.
        // See https://discourse.mozilla.org/t/webextension-apis-made-as-getter-setter-lazily-evaluating-to-functions-beware-of-mocking-for-unit-tests/30849

        /* eslint-disable no-unused-expressions */
        browser.browserAction.setIcon;
        /* eslint-enable no-unused-expressions */
    });

    let mockBrowserAction;

    beforeEach(function() {
        mockBrowserAction = sinon.mock(browser.browserAction);
    });
    afterEach(function() {
        sinon.restore();
    });

    /**
     * Verifies the colored icon has been set.
     *
     * @function
     * @param {Object} testFunction the function to call for testing, must
                                    return a Promise
     * @returns {Promise}
     */
    async function testIconIsColored(testFunction) {
        /* eslint-disable indent */
        mockBrowserAction.expects("setIcon")
                .once().withArgs({path: "/icons/icon-small-colored.svg"})
                .resolves();

        await testFunction();

        // verify results
        mockBrowserAction.verify();
    };

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
    function stubSettings(settingsObject) {
        // as we cannot stub ES6 modules, we need to stub the underlying settings API
        sinon.stub(browser.storage.sync, "get").resolves(settingsObject);

        // purge cache
        return AddonSettings.loadOptions();
    };

    /**
     * Verifies the colored icon has been unset/removed.
     *
     * @function
     * @param {Object} testFunction the function to call for testing, must
                                    return a Promise
     * @returns {Promise}
     */
    async function testIconIsNotColored(testFunction) {
        /* eslint-disable indent */
        mockBrowserAction.expects("setIcon")
                .once().withArgs({path: null})
                .resolves();

        await testFunction();

        // verify results
        mockBrowserAction.verify();
    };

    describe("changeIconIfColored()", function () {
        it("changes icon to colored one", function () {
            return testIconIsColored(IconHandler.changeIconIfColored.bind(null, true));
        });

        it("resets icon to not colored one", function () {
            return testIconIsNotColored(IconHandler.changeIconIfColored.bind(null, false));
        });
    });

    describe("init()", function () {
        it("loads settings and sets colored icon", async function () {
            stubSettings({
                "popupIconColored": true
            });

            return testIconIsColored(IconHandler.init);
        });

        it("loads settings and sets not colored icon", async function () {
            stubSettings({
                "popupIconColored": false
            });

            return testIconIsNotColored(IconHandler.init);
        });
    });
});
