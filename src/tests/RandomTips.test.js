import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as RandomTips from "/common/modules/RandomTips.js";

import {stubSettings} from "./modules/StubHelper.js";
import * as HtmlMock from "./modules/HtmlMock.js";

describe("common module: RandomTips", function () {
    afterEach(function() {
        sinon.restore();
    });

    /**
     * Stubs the random function, so it always passes.
     *
     * @function
     * @returns {void}
     */
    export function disableRandomness() {
        // randomizePassed in RandomTips passes for low values
        sinon.stub(Math, "random").returns(0);
    };

    /**
     * Stubs the random function, so it always fails.
     *
     * @function
     * @returns {void}
     */
    export function forceFailRandomness() {
        // randomizePassed in RandomTips fails for high values
        sinon.stub(Math, "random").returns(1);
    };

    /**
     * Asserts that no random tip has been shown.
     *
     * @todo implement
     * @function
     * @returns {void}
     */
    export function assertNoRandomTipShown() {
        // TODO
    };

    /**
     * Asserts that a random tip has been shown.
     *
     * @todo implement
     * @function
     * @returns {void}
     */
    export function assertRandomTipShown() {
        // TODO
    };

    describe("showRandomTipIfWanted()", function () {
        beforeEach(function () {
            stubSettings({
                "randomTips": {
                    "triggeredOpen": 999 // prevent fails due to low trigger count
                }
            });
        };

        it("does not show tip if randomize fails", function () {
            forceFailRandomness();

            RandomTips.showRandomTipIfWanted();

            assertNoRandomTipShown();
        });

        it("does show tip if randomize works", function () {
            disableRandomness();

            RandomTips.showRandomTipIfWanted();

            assertRandomTipShown();
        });
    });
});
