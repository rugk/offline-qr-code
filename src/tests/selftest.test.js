import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

describe("selftest", function () {
    describe("test works", function () {
        it("positive assertion works", function () {
            chai.assert.isOk(true);
        });

        it("negative assertion works", function () {
            chai.assert.isNotOk(false);
        });
    });
});
