import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import isObjectLike from "/common/modules/lodash/isObjectLike.js";

describe("common lodash: isObjectLike", function () {

    it("method is like object", function () {
    /**
        * Dummy function
        * @returns {number}.
        */
        function Foo() {
            return 1 + 2;
        }
        chai.assert.isTrue(isObjectLike(new Foo));
    });

    it("null is not object", function () {
        chai.assert.isFalse(isObjectLike(null));
    });

    it("list is like object", function () {
        chai.assert.isTrue(isObjectLike([1,2,3]));
    });

    it("JSON is like object", function () {
        chai.assert.isTrue(isObjectLike({}));
    });

});
