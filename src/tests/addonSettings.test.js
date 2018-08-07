import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.4/pkg/sinon.js"; /* globals sinon */

import * as Localizer from "/common/modules/Localizer.js";

const sandbox = sinon.sandbox.create();

describe("common module: Localizer", function () {
    beforeEach(function() {
        const managedStorage = sinon.fake.resolves({});
        sandbox.replace(browser.storage.managed, "get", managedStorage);
    });
    afterEach(function() {
        sandbox.restore();
    });

    describe("loadOptions()", function () {
        it("is there", function () {
            chai.assert.exists(Colors.CONTRAST_RATIO);
            chai.assert.isNotEmpty(Colors.CONTRAST_RATIO);
        });

        it("is frozen", function () {
            chai.assert.isFrozen(Colors.CONTRAST_RATIO);
        });
    });

    describe("get()", function () {
        it("is there", function () {
            chai.assert.exists(Colors.CONTRAST_RATIO);
            chai.assert.isNotEmpty(Colors.CONTRAST_RATIO);
        });

        it("is frozen", function () {
            chai.assert.isFrozen(Colors.CONTRAST_RATIO);
        });
    });
});
