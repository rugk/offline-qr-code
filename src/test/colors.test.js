import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import * as Colors from "/common/modules/Colors.js";

describe("common module: Color", () => {
    it("should return sum of arguments", () => {
        chai.expect([0, 0, 0] , Colors.hexToRgb("#000000"));
    });
});
