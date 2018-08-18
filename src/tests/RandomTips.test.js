import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as RandomTips from "/common/modules/RandomTips.js";

import * as AddonSettingsStub from "./modules/AddonSettingsStub.js";
import * as HtmlMock from "./modules/HtmlMock.js";

const HTML_BASE_FILE = "./randomTips/baseCode.html";

describe("common module: RandomTips", function () {
    before(function () {
        AddonSettingsStub.before();
    });

    beforeEach(async function() {
        AddonSettingsStub.stubAllStorageApis();
        await HtmlMock.setTestHtmlFile(HTML_BASE_FILE);
    });

    afterEach(function() {
        AddonSettingsStub.afterTest();
        HtmlMock.cleanup();
        sinon.restore();
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
     * @returns {Promise}
     */
    function stubEmptySettings() {
        return AddonSettingsStub.stubSettings({
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

    /**
     * Returns the text of the currently shown tip.
     *
     * @function
     * @returns {string}
     */
    function getTextOfTip() {
        const elText = document.querySelector("#messageTips .message-text");
        return elText.innerHTML;
    }

    /**
     * Asserts that a specific random tip has been shown.
     *
     * @function
     * @param {string} expectedTipText the tip text to expect
     * @returns {void}
     */
    function assertRandomTipWithTextShown(expectedTipText) {
        assertRandomTipShown();

        const text = getTextOfTip();
        chai.assert.strictEqual(text, expectedTipText, "Tip with different message text shown.");
    }

    /**
     * Asserts that a specific random tip of a list has been shown.
     *
     * In contrast to {@link assertRandomTipWithTextShown()} this allows an array
     * of multiple allowed texts.
     *
     * @function
     * @param {Array.<string>} expectedTipTexts the tip texts to expect
     * @returns {string} the actually shown text
     */
    function assertOneOfRandomTipsShown(expectedTipTexts) {
        assertRandomTipShown();

        const text = getTextOfTip();

        chai.assert.oneOf(text, expectedTipTexts, "Tip with different message text than the allowed expected ones shown.");
        return text;
    }

    describe("showRandomTipIfWanted()", function () {
        beforeEach(function () {
            stubEmptySettings(); // TODO: for some reason, does not prevent count below from going to large
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
    });

    describe("config savings", function () {
        let clock;

        beforeEach(function () {
            clock = sinon.useFakeTimers();
        });

        afterEach(function () {
            clock.restore();
        });

        it("adds settings template for storing data", async function () {
            disableRandomness();

            await RandomTips.init([alwaysShowsTip]);

            // need to wait as saving is debounced
            RandomTips.showRandomTipIfWanted();
            clock.next();

            // verify the setting has been saved
            sinon.assert.callCount(AddonSettingsStub.stubs.sync.set, 1);

            // verify the saved settings are expected
            const data = AddonSettingsStub.syncStorage.internalStorage;

            // verify it saved some settings
            // (may contain more data due to )
            chai.assert.containsAllDeepKeys(
                data,
                {
                    "randomTips": {
                        tips: {},
                        "triggeredOpen": 1
                    }
                }
            );

            // verify it's trigger count is set to 1
            chai.assert.nestedPropertyVal(data, "randomTips.triggeredOpen", 1);
        });

        it("counts triggeredOpen setting up", async function () {
            stubEmptySettings();
            forceFailRandomness();

            await RandomTips.init([alwaysShowsTip]);

            // need to wait as saving is debounced
            RandomTips.showRandomTipIfWanted();
            clock.next();

            // verify the setting has been saved
            sinon.assert.callCount(AddonSettingsStub.stubs.sync.set, 1);

            // verify the saved settings are expected
            const data = AddonSettingsStub.syncStorage.internalStorage;

            // stubEmptySettings sets it to 999, so should be 1000 now
            chai.assert.strictEqual(
                data.randomTips.triggeredOpen,
                1000
            );
        });

        it("adds some config values for selected tip", async function () {
            stubEmptySettings();
            disableRandomness();

            await RandomTips.init([alwaysShowsTip]);

            // need to wait as saving is debounced
            RandomTips.showRandomTipIfWanted();
            clock.next();

            // verify the setting has been saved
            sinon.assert.callCount(AddonSettingsStub.stubs.sync.set, 1);

            // verify the saved settings are expected
            const data = AddonSettingsStub.syncStorage.internalStorage;

            // verify it saved some settings
            chai.assert.isNotEmpty(data.randomTips.tips.alwaysShowsTip);
        });
    });

    describe("showRandomTip() – single tip tests", function () {
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

    describe("showRandomTip() – multiple tips", function () {
        it("does show multiple (2) tips", async function () {
            stubEmptySettings();

            const tip1 = Object.assign({}, alwaysShowsTip);
            tip1.text = "tip1Text";
            const tip2 = Object.assign({}, alwaysShowsTip);
            tip2.text = "tip2Text";

            let tip1InternalCount = 0;
            let tip2InternalCount = 0;

            await RandomTips.init([tip1, tip2]);

            // show tips again and again until it finally has shown both tips at
            // least once
            do {
                RandomTips.showRandomTip();

                const shownTip = assertOneOfRandomTipsShown(["tip1Text", "tip2Text"]);

                switch (shownTip) {
                case "tip1Text":
                    tip1InternalCount++;
                    break;
                case "tip2Text":
                    tip2InternalCount++;
                    break;
                }
            } while (tip1InternalCount > 0 && tip2InternalCount > 0);
        });

        it("does only show valid tip", async function () {
            stubEmptySettings();

            const tip1 = Object.assign({}, alwaysShowsTip);
            tip1.text = "tip1Text";
            tip1.requireShowCount = 0; // should never show
            const tip2 = Object.assign({}, alwaysShowsTip);
            tip2.text = "tip2Text";

            await RandomTips.init([tip1, tip2]);

            // repeat 3 times, to be sure
            for (let i = 0; i < 3; i++) {
                RandomTips.showRandomTip();

                assertRandomTipWithTextShown("tip2Text");
            }
        });

        it("does only show tip, where settings allow it", async function () {
            AddonSettingsStub.stubSettings({
                "randomTips": {
                    tips: {
                        "alreadyShownTip1": {
                            shownCount: 1
                        }
                    },
                    "triggeredOpen": 999 // prevent fails due to low trigger count
                }
            });
            const tip1 = Object.assign({}, alwaysShowsTip);
            tip1.id = "alreadyShownTip1";
            tip1.requireShowCount = 1; // already shown enough times
            tip1.text = "tip1Text";

            const tip2 = Object.assign({}, alwaysShowsTip);
            tip2.text = "tip2Text";

            await RandomTips.init([tip1, tip2]);

            // repeat 3 times, to be sure
            for (let i = 0; i < 3; i++) {
                RandomTips.showRandomTip();

                assertRandomTipWithTextShown("tip2Text");
            }
        });

        it("does show tips relatively randomly", async function () {
            stubEmptySettings();

            const tipArray = [];
            // const tipArrayTexts = [];
            const tipCount = [];

            for (let i = 0; i < 10; i++) {
                const tip = Object.assign({}, alwaysShowsTip);
                tip.text = `tip${i}Text`;

                tipArray.push(tip);
                // tipArrayTexts.push(tip.text);
                tipCount[i] = 0;
            }

            await RandomTips.init(tipArray);

            // show tips again and again until it finally has shown both tips at
            // least once
            for (let i = 0; i < 1000; i++) {
                RandomTips.showRandomTip();

                // to speed up tests, we do not use assertOneOfRandomTipsShown()
                // here.
                // const shownTip = assertOneOfRandomTipsShown(tipArrayTexts);
                const shownTip = getTextOfTip();

                // We can assume kit matches correctly, if not the test fails
                // with an exception.

                // https://regex101.com/r/3zhjAe/1
                const matches = /tip(\d*)Text/.exec(shownTip);
                const num = matches[1]; // first matched group

                // count up
                tipCount[num]++;
            }

            // assert that each message was not shown too few or too much times
            // expectation value: 100; we allow an absolute variance of 50
            for (let i = 0; i < 10; i++) {
                chai.assert.isAtLeast(tipCount[i], 50, `tip #${i} has been shown too few times`);
                chai.assert.isAtMost(tipCount[i], 150, `tip #${i} has been shown too much times`);
            }
        });
    });
});
