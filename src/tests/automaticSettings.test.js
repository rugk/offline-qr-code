import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as AutomaticSettings from "/options/modules/AutomaticSettings/AutomaticSettings.js";

import * as AddonSettingsStub from "./modules/AddonSettingsStub.js";
import * as HtmlMock from "./modules/HtmlMock.js";

describe("options module: AutomaticSettings", function () {
    before(function () {
        AddonSettingsStub.before();
    });

    beforeEach(function() {
        AddonSettingsStub.stubAllStorageApis();
    });

    afterEach(function() {
        sinon.restore();
        HtmlMock.cleanup();
        AddonSettingsStub.afterTest();
    });

    describe("init()", function () {
        it("does nothing if no options HTML with .settings class is given", function () {
            AddonSettingsStub.stubSettings({
                greatSettingsNum: 1234,
                leetCauseIwantIt: 1337,
                whatToDo: "retry"
            });

            const originalHtml = HtmlMock.stripAllNewlines(`<p>nothing special</p>
            <li><label for="greatSettingsNum">greatSettingsNum</label>
            <input class="leetCauseIwantIt" type="number" id="greatSettingsNum" name="greatSettingsNum">
            </li>`);
            HtmlMock.setTestHtml(originalHtml);

            // run test
            AutomaticSettings.init();

            // assert that value has been replaced correctly
            chai.assert.strictEqual(HtmlMock.getTestHtml(), originalHtml, "illegally modified the HTML text");
        });
    });
});
