import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.4/pkg/sinon.js"; /* globals sinon */
import * as Colors from "/common/modules/Colors.js";

describe("common module: Color", () => {
    it("hexToRgb()", () => {
        it("split color correctly", () => {
            chai.expect([0, 0, 0] , Colors.hexToRgb("#000000"));
            chai.expect([0, 0, 0] , Colors.hexToRgb("X000000"));
        });
    });
});
