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
        // unset AutomaticSettings default option provider
        AutomaticSettings.setDefaultOptionProvider(undefined);

        AddonSettingsStub.stubAllStorageApis();
    });

    afterEach(function() {
        sinon.restore();
        HtmlMock.cleanup();
        AddonSettingsStub.afterTest();
    });

    describe("setDefaultOptionProvider()", function () {
        it("throws if setDefaultOptionProvider is not set before .init is called", function () {
            chai.assert.throws(AutomaticSettings.init, Error, "Default option provider is not set. You need to call setDefaultOptionProvider() before .init() to set it.");
        });

        it("uses default value if value is not saved in settings", async function () {
            await AddonSettingsStub.stubSettings({});

            const originalHtml = HtmlMock.stripAllNewlines(`<p>nothing special</p>
            <li><label for="greatSettingsNum">greatSettingsNum</label>
            <input class="setting" id="greatSettingsNum" name="greatSettingsNum" type="number">
            </li>`);
            HtmlMock.setTestHtml(originalHtml);

            // setup default option provider
            const defaultOptionProvider = sinon.stub().withArgs("greatSettingsNum").returns(777);
            AutomaticSettings.setDefaultOptionProvider(defaultOptionProvider);

            // run test
            await AutomaticSettings.init();

            // assert that HTML code has not been changed
            chai.assert.strictEqual(HtmlMock.getTestHtml(), originalHtml, "illegally modified the HTML text");

            // assert that default options were called correctly
            sinon.assert.calledOnce(defaultOptionProvider);
            defaultOptionProvider.firstCall.calledWithExactly("greatSettingsNum");

            // assert that value of option has been set
            chai.assert.strictEqual(document.getElementById("greatSettingsNum").value, "777", "set value of option altghough it was expected not to set it");
        });

        it("does not do anything if not used and value is set in code", async function () {
            await AddonSettingsStub.stubSettings({});

            const originalHtml = HtmlMock.stripAllNewlines(`<p>nothing special</p>
            <li><label for="greatSettingsNum">greatSettingsNum</label>
            <input class="setting" id="greatSettingsNum" name="greatSettingsNum" type="number" value="123">
            </li>`);
            HtmlMock.setTestHtml(originalHtml);

            // setup default option provider
            AutomaticSettings.setDefaultOptionProvider(null);

            // run test
            await AutomaticSettings.init();

            // assert that HTML code has not been changed
            chai.assert.strictEqual(HtmlMock.getTestHtml(), originalHtml, "illegally modified the HTML text");

            // assert that value of option has not been modified
            chai.assert.strictEqual(document.getElementById("greatSettingsNum").value, "123", "set value of option altghough it was expected not to set it");
        });
    });

    describe("init()", function () {
        /**
         * Sets up the option code to test.
         *
         * @public
         * @function
         * @param {string} htmlCode
         * @param {string} optionName
         * @param {string} optionId element ID to read value from
         * @param {any} validValue  the value that is considered to be valid
         * @returns {Promise}
         */
        async function setOptionTest(htmlCode, optionName, optionId, validValue) {
            await AddonSettingsStub.stubSettings({
                [optionName]: validValue
            });

            const originalHtml = HtmlMock.stripAllNewlines(htmlCode);
            HtmlMock.setTestHtml(originalHtml);

            // setup default option provider
            const defaultOptionProvider = sinon.stub().returns(777);
            AutomaticSettings.setDefaultOptionProvider(defaultOptionProvider);

            // run test
            await AutomaticSettings.init();

            // assert that default options were not used
            sinon.assert.notCalled(defaultOptionProvider);

            return originalHtml;
        }

        /**
         * Tests a particular option type and if the option is correctly set.
         *
         * @public
         * @function
         * @param {string} htmlCode
         * @param {string} optionName
         * @param {string} optionId element ID to read value from
         * @param {any} validValue  the value that is considered to be valid
         * @param {function} [verifyValue]  function to manually verify the value instead of checking .value
         * @returns {Promise}
         */
        async function testOptionType(htmlCode, optionName, optionId, validValue, verifyValue) {
            const originalHtml = await setOptionTest(htmlCode, optionName, optionId, validValue);

            // assert that HTML code has not been changed
            chai.assert.strictEqual(HtmlMock.getTestHtml(), originalHtml, "illegally modified the HTML text");

            // assert that value of option has been set
            if (verifyValue) {
                verifyValue(document.getElementById(optionId), validValue);
            } else {
                chai.assert.strictEqual(document.getElementById(optionId).value, validValue, "did not set value of option correctly");
            }
        }

        it("does nothing if no options HTML with .settings class is given", async function () {
            await AddonSettingsStub.stubSettings({
                greatSettingsNum: 1234,
                leetCauseIwantIt: 1337,
                whatToDo: "retry"
            });

            const originalHtml = HtmlMock.stripAllNewlines(`<p>nothing special</p>
            <li><label for="greatSettingsNum">greatSettingsNum</label>
            <input class="leetCauseIwantIt" id="greatSettingsNum" name="greatSettingsNum" type="number">
            </li>`);
            HtmlMock.setTestHtml(originalHtml);

            // setup default option provider
            const defaultOptionProvider = sinon.stub().returns(777);
            AutomaticSettings.setDefaultOptionProvider(defaultOptionProvider);

            // run test
            await AutomaticSettings.init();

            // assert that value has been replaced correctly
            chai.assert.strictEqual(HtmlMock.getTestHtml(), originalHtml, "illegally modified the HTML text");

            // assert that default options were not used
            sinon.assert.notCalled(defaultOptionProvider);

            // assert that value of option has NOT been set
            chai.assert.strictEqual(document.getElementById("greatSettingsNum").value, "", "set value of option altghough it was expected not to set it");
        });

        it("sets input type=number correctly", function () {
            return testOptionType(`
            <li><label for="greatSettingsNum">greatSettingsNum</label>
            <input class="setting" id="greatSettingsNum" name="greatSettingsNum" type="number">
            </li>`, "greatSettingsNum", "greatSettingsNum", "1234");
        });

        it("sets input type=text correctly", function () {
            return testOptionType(`
            <li><label for="greatSettings">test text type</label>
            <input class="setting" id="greatSettings" name="greatSettings" type="text">
            </li>`, "greatSettings", "greatSettings", "blagood328!!!");
        });

        it("sets input type=checkbox correctly", function () {
            return testOptionType(`
            <li>
                <input class="setting" id="enableExample" type="checkbox">
                <label for="checkOkay">activate or disable a thing</label>
            </li>`, "enableExample", "enableExample", true, (elOption) => {
                chai.assert.strictEqual(elOption.checked, true, "did not set value of checkbox correctly");
            });
        });

        it("sets select value correctly", function () {
            return testOptionType(`
            <li>
                <label for="selection">Select one thing: </label>
                <select id="selection" class="setting" name="select" size="0">
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                </select>
            </li>`, "selection", "selection", "Q", (elOption) => {
                chai.assert.strictEqual(elOption.querySelector('option[value="L"]').selected, false, "did not set value of select option[value=L] correctly");
                chai.assert.strictEqual(elOption.querySelector('option[value="M"]').selected, false, "did not set value of select option[value=M] correctly");
                chai.assert.strictEqual(elOption.querySelector('option[value="Q"]').selected, true, "did not set value of select option[value=Q] correctly");
                chai.assert.strictEqual(elOption.querySelector('option[value="H"]').selected, false, "did not set value of select option[value=H] correctly");
            });
        });

        it("sets fieldset (radiogroup) value correctly", async function () {
            await setOptionTest(`<li>
            <fieldset id="sizeType" data-type="radiogroup" class="setting">
                <legend >set mode</legend>
                <ul>
                    <li>
                        <input id="sizeOne" type="radio" name="size" value="oneValue">
                        <label for="sizeOne">Size one</label>

                        <input class="notASetting" type="number" id="unrelatedOption" name="uugh">
                        <span>px</span>
                    </li>

                    <li>
                        <input id="sizeTwo" type="radio" name="size" value="twoValue">
                        <label for="sizeTwo">Size two</label>
                    </li>

                    <li>
                        <input id="sizeThree" type="radio" name="size" value="threeValue">
                        <label for="sizeThree">Size three</label>
                    </li>
                </ul>
            </fieldset>
            </li>`, "sizeType", "selection", "twoValue");

            // assert that HTML code has not been changed
            chai.assert.strictEqual(document.getElementById("sizeOne").hasAttribute("checked"), false, "raadio button #sizeOne is not unchecked");
            chai.assert.strictEqual(document.getElementById("sizeTwo").hasAttribute("checked"), true, "raadio button #sizeTwo is not checked");
            chai.assert.strictEqual(document.getElementById("sizeThree").hasAttribute("checked"), false, "raadio button #sizeOne is not unchecked");
        });
    });
});
