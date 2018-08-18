import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import * as MessageLevel from "/common/modules/data/MessageLevel.js";

describe("common data: MessageLevel", function () {
    describe("MESSAGE_LEVEL", function () {
        it("is there", function () {
            chai.assert.exists(MessageLevel.MESSAGE_LEVEL);
            chai.assert.isNotEmpty(MessageLevel.MESSAGE_LEVEL);
        });

        it("is object", function () {
            chai.assert.isObject(MessageLevel.MESSAGE_LEVEL);
        });
    });
});
