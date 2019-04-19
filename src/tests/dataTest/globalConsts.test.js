import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import * as GlobalConsts from "/common/modules/data/GlobalConsts.js";

describe("common data: GlobalConsts", function () {
    describe("ADDON_NAME", function () {
        it("is there", function () {
            chai.assert.exists(GlobalConsts.ADDON_NAME);
            chai.assert.isNotEmpty(GlobalConsts.ADDON_NAME);
        });

        it("is string", function () {
            chai.assert.isString(GlobalConsts.ADDON_NAME);
        });
    });

    describe("ADDON_NAME_SHORT", function () {
        it("is there", function () {
            chai.assert.exists(GlobalConsts.ADDON_NAME_SHORT);
            chai.assert.isNotEmpty(GlobalConsts.ADDON_NAME_SHORT);
        });

        it("is string", function () {
            chai.assert.isString(GlobalConsts.ADDON_NAME_SHORT);
        });
    });
});
