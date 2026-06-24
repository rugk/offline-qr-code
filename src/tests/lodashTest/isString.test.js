import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import isString from "/common/modules/lodash/isString.js";

describe("common lodash: isString", function () {

    it("character is a String", function () {
        chai.assert.isTrue(isString('testCharacters'));
    });

    it("method is not a String", function () {
    /**
        * Dummy function
        * @returns {number}.
        */
        function Foo() {
            return 1 + 2;
        }
        chai.assert.isFalse(isString(Foo));
    });

    it("null is not a String", function () {
        chai.assert.isFalse(isString(null));
    });

    it("number is not a String", function () {
        chai.assert.isFalse(isString(12));
    });
});
