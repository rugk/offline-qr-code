import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import { tips } from "/common/modules/data/Tips.js";

// TODO: only checks two levels deep. Currently, we do not require/test the third-level 8to be frozen)

describe("common data: tips", function () {
    describe("tips", function () {
        it("is there", function () {
            chai.assert.exists(tips);
            chai.assert.isNotEmpty(tips);
        });

        it("is array", function () {
            chai.assert.isArray(tips);
        });

        it("is frozen", function () {
            chai.assert.isFrozen(tips);
        });
    });

    describe("tips – inner objects", function () {
        it("are there", function () {
            for (const tipObject of tips) {
                chai.assert.exists(tipObject);
                chai.assert.isNotEmpty(tipObject);
            }
        });

        it("are objects", function () {
            for (const tipObject of tips) {
                chai.assert.isObject(tipObject);
            }
        });

        it("are frozen", function () {
            for (const tipObject of tips) {
                chai.assert.isFrozen(tipObject);
            }
        });
    });
});
