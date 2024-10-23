import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import isFunction from "/common/modules/lodash/isFunction.js";

describe("common lodash: isFunction", function () {

    it("method is a function", function () {
    /**
        * Dummy function
        * @returns {number}.
        */
        function Foo() {
            return 1 + 2;
        }
        chai.assert.isTrue(isFunction(Foo));
    });

    it("null is not function", function () {
        chai.assert.isFalse(isFunction(null));
    });

    it("list is not function", function () {
        chai.assert.isFalse(isFunction([1,2,3]));
    });


});
