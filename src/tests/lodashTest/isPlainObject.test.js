import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import isPlainObject from "/common/modules/lodash/isPlainObject.js";

describe("common lodash: isPlainObject", function () {

    it("method is not plain object", function () {
    /**
        * Dummy function
        * @returns {number}.
        */
        function Foo() {
            return 1 + 2;
        }
        chai.assert.isFalse(isPlainObject(new Foo));
    });

    it("list is not plain object", function () {
        chai.assert.isFalse(isPlainObject([1, 2, 3]));
    });

    it("JSON object is plain object", function () {
        chai.assert.isTrue(isPlainObject({ "x": 0, "y": 0 }));
    });

});
