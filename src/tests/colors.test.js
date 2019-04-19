import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import * as Colors from "/common/modules/Colors.js";

const COLOR_ARRAY = Object.freeze({
    // contrast 1
    WHITE: [255, 255, 255],
    BLACK: [0, 0, 0],

    // contrast 2
    "#00FEFF": [0, 254, 255], // nearly Cyan (#00FFFF), teal50 from Firefox Photon
    "#FF0000": [255, 0, 0], // red

    // contrast 3
    "#4F477D": [79, 71, 125],
    "#757D47": [17, 125, 71]
});

describe("common module: Color", function () {
    describe("CONTRAST_RATIO", function () {
        it("is there", function () {
            chai.assert.exists(Colors.CONTRAST_RATIO);
            chai.assert.isNotEmpty(Colors.CONTRAST_RATIO);
        });

        it("is frozen", function () {
            chai.assert.isFrozen(Colors.CONTRAST_RATIO);
        });
    });

    describe("contrastRatio()", function () {
        const ALLOWED_DELTA = 0.01;

        it("returns minimum contrast ratio for same color", function () {
            chai.assert.strictEqual(Colors.contrastRatio(COLOR_ARRAY.WHITE, COLOR_ARRAY.WHITE), 1);
            chai.assert.strictEqual(Colors.contrastRatio(COLOR_ARRAY.BLACK, COLOR_ARRAY.BLACK), 1);
            chai.assert.strictEqual(Colors.contrastRatio(COLOR_ARRAY["#00FEFF"], COLOR_ARRAY["#00FEFF"]), 1);
        });


        it("returns maxiumum contrast ratio for black/white", function () {
            chai.assert.strictEqual(Colors.contrastRatio(COLOR_ARRAY.WHITE, COLOR_ARRAY.BLACK), 21);
            chai.assert.strictEqual(Colors.contrastRatio(COLOR_ARRAY.BLACK, COLOR_ARRAY.WHITE), 21);
        });

        it("returns correct contrast ratio for #00FEFF/white (low)", function () {
            chai.assert.approximately(Colors.contrastRatio(COLOR_ARRAY["#00FEFF"], COLOR_ARRAY.WHITE), 1.26, ALLOWED_DELTA);
            chai.assert.approximately(Colors.contrastRatio(COLOR_ARRAY.WHITE, COLOR_ARRAY["#00FEFF"]), 1.26, ALLOWED_DELTA);
        });

        it("returns correct contrast ratio for #00FEFF/black (high)", function () {
            chai.assert.approximately(Colors.contrastRatio(COLOR_ARRAY["#00FEFF"], COLOR_ARRAY.BLACK), 16.62, ALLOWED_DELTA);
            chai.assert.approximately(Colors.contrastRatio(COLOR_ARRAY.BLACK, COLOR_ARRAY["#00FEFF"]), 16.62, ALLOWED_DELTA);
        });

        it("returns correct contrast ratio for #00FEFF/#4F477D (medium)", function () {
            chai.assert.approximately(Colors.contrastRatio(COLOR_ARRAY["#00FEFF"], COLOR_ARRAY["#4F477D"]), 6.57, ALLOWED_DELTA);
            chai.assert.approximately(Colors.contrastRatio(COLOR_ARRAY["#4F477D"], COLOR_ARRAY["#00FEFF"]), 6.57, ALLOWED_DELTA);
        });
    });

    describe("invertColor()", function () {
        it("inverts white to black", function () {
            chai.assert.strictEqual(Colors.invertColor(COLOR_ARRAY.WHITE), "#000000");
        });

        it("inverts black to white", function () {
            chai.assert.strictEqual(Colors.invertColor(COLOR_ARRAY.BLACK), "#ffffff");
        });

        it("inverts #00FEFF and #FF0000 correctly", function () {
            chai.assert.strictEqual(Colors.invertColor(COLOR_ARRAY["#00FEFF"]), "#ff0100");
            chai.assert.strictEqual(Colors.invertColor(COLOR_ARRAY["#FF0000"]), "#00ffff");
        });

        it("inverts #4F477D and #757D47 correctly", function () {
            chai.assert.strictEqual(Colors.invertColor(COLOR_ARRAY["#4F477D"]), "#b0b882");
            chai.assert.strictEqual(Colors.invertColor(COLOR_ARRAY["#757D47"]), "#ee82b8");
        });
    });

    describe("hexToRgb()", function () {
        it("splits color correctly: black", function () {
            chai.assert.deepEqual(Colors.hexToRgb("#000000"), COLOR_ARRAY.BLACK, "hex with # does not work");
            chai.assert.deepEqual(Colors.hexToRgb("000000"), COLOR_ARRAY.BLACK, "hex without # does not work");
        });

        it("splits color correctly: white uppercase", function () {
            chai.assert.deepEqual(Colors.hexToRgb("#FFFFFF"), COLOR_ARRAY.WHITE, "hex with # does not work");
            chai.assert.deepEqual(Colors.hexToRgb("FFFFFF"), COLOR_ARRAY.WHITE, "hex without # does not work");
        });

        it("splits color correctly: white lowercase", function () {
            chai.assert.deepEqual(Colors.hexToRgb("#ffffff"), COLOR_ARRAY.WHITE, "hex with # does not work");
            chai.assert.deepEqual(Colors.hexToRgb("ffffff"), COLOR_ARRAY.WHITE, "hex without # does not work");
        });

        it("splits color correctly: #4f477D", function () {
            chai.assert.deepEqual(Colors.hexToRgb("#4f477D"), COLOR_ARRAY["#4F477D"], "hex with # does not work");
            chai.assert.deepEqual(Colors.hexToRgb("4f477D"), COLOR_ARRAY["#4F477D"], "hex without # does not work");
        });

        it("splits color correctly: #00feff", function () {
            chai.assert.deepEqual(Colors.hexToRgb("#00feff"), COLOR_ARRAY["#00FEFF"], "hex with # does not work");
            chai.assert.deepEqual(Colors.hexToRgb("00feff"), COLOR_ARRAY["#00FEFF"], "hex without # does not work");
        });

        it("split color fails for invalid values: obvious ones", function () {
            chai.assert.strictEqual(Colors.hexToRgb("4"), null);
            chai.assert.strictEqual(Colors.hexToRgb(null), null);
            chai.assert.strictEqual(Colors.hexToRgb("#"), null);
        });

        it("split color fails for not supported three-letter colors", function () {
            chai.assert.strictEqual(Colors.hexToRgb("#000"), null);
            chai.assert.strictEqual(Colors.hexToRgb("000"), null);
            chai.assert.strictEqual(Colors.hexToRgb("#123"), null);
            chai.assert.strictEqual(Colors.hexToRgb("123"), null);
        });
    });
});
