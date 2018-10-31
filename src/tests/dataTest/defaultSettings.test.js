import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import { DEFAULT_SETTINGS } from "/common/modules/data/DefaultSettings.js";

describe("common data: DEFAULT_SETTINGS", function () {
    describe("DEFAULT_SETTINGS", function () {
        it("is there", function () {
            chai.assert.exists(DEFAULT_SETTINGS);
            chai.assert.isNotEmpty(DEFAULT_SETTINGS);
        });

        it("is object", function () {
            chai.assert.isObject(DEFAULT_SETTINGS);
        });

        it("is frozen", function () {
            chai.assert.isFrozen(DEFAULT_SETTINGS);
        });
    });
});
