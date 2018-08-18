import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as RandomTips from "/common/modules/RandomTips.js";

import {disableModifyingSyncStore, stubSettings} from "./modules/AddonSettingsStub.js";
import * as HtmlMock from "./modules/HtmlMock.js";

const HTML_BASE_FILE = "./randomTips/baseCode.html";

describe("common module: RandomTips", function () {
    beforeEach(async function () {
        await HtmlMock.setTestHtmlFile(HTML_BASE_FILE);
        disableModifyingSyncStore();
    });

    afterEach(function() {
        sinon.restore();
        HtmlMock.cleanup();
    });

    /**
     * Stubs the random function, so it always passes.
     *
     * @function
     * @returns {void}
     */
    function disableRandomness() {
        // randomizePassed in RandomTips passes for low values
        sinon.stub(Math, "random").returns(0);
    }

    /**
     * Stubs the random function, so it always fails.
     *
     * @function
     * @returns {void}
     */
    function forceFailRandomness() {
        // randomizePassed in RandomTips fails for high values
        sinon.stub(Math, "random").returns(1);
    }

    /**
     * Stubs "empty" "randomTips" setting, i.e. a a setting that has no values
     * and does not interfere with the result.
     *
     * @function
     * @returns {void}
     */
    function stubEmptySettings() {
        stubSettings({
            "randomTips": {
                tips: {},
                "triggeredOpen": 999 // prevent fails due to low trigger count
            }
        });
    }

    const alwaysShowsTip = {
        id: "alwaysShowsTip",
        requireShowCount: 999,
        requiredTriggers: 0,
        requireDismiss: false,
        maximumDismiss: null,
        text: "A tip to always show."
    };

    /**
     * Asserts that no random tip has been shown.
     *
     * @function
     * @returns {void}
     */
    function assertNoRandomTipShown() {
        chai.assert.exists(document.getElementById("noMessageShown"), "RandomTip was shown, although no RandomTip was expected.");
    }

    /**
     * Asserts that a random tip has been shown.
     *
     * @function
     * @returns {void}
     */
    function assertRandomTipShown() {
        chai.assert.notExists(document.getElementById("noMessageShown"), "RandomTip was not shown, although RandomTip was expected.");
    }

    describe("showRandomTipIfWanted()", function () {
        beforeEach(function () {
            stubEmptySettings();
        });

        it("does not show tip if randomize fails", async function () {
            forceFailRandomness();

            await RandomTips.init([alwaysShowsTip]);
            RandomTips.showRandomTipIfWanted();

            assertNoRandomTipShown();
        });

        it("does show tip if randomize works", async function () {
            disableRandomness();

            await RandomTips.init([alwaysShowsTip]);
            RandomTips.showRandomTipIfWanted();

            assertRandomTipShown();
        });

        it("counts triggeredOpen setting up", async function () {
            forceFailRandomness();

            await RandomTips.init([alwaysShowsTip]);
            RandomTips.showRandomTipIfWanted();

            // TODO: assert saved values
        });
    });

    describe("showRandomTip()", function () {
        it("does nothing, if no tips specified", async function () {
            stubEmptySettings();

            await RandomTips.init([]);
            RandomTips.showRandomTip();

            assertNoRandomTipShown();
        });

        it("does show tip if tip is specified", async function () {
            stubEmptySettings();

            await RandomTips.init([alwaysShowsTip]);
            RandomTips.showRandomTip();

            assertRandomTipShown();
        });
    });
});
