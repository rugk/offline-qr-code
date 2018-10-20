import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as MessageHandler from "/common/modules/MessageHandler.js";

import * as AutomaticSettings from "/options/modules/AutomaticSettings/AutomaticSettings.js";

import * as AddonSettingsStub from "./modules/AddonSettingsStub.js";
import * as HtmlMock from "./modules/HtmlMock.js";
import {wait} from "./modules/PromiseHelper.js";

describe("options module: AutomaticSettings", function () {
    before(function () {
        AddonSettingsStub.before();
    });

    beforeEach(function() {
        // unset AutomaticSettings provided stuff
        AutomaticSettings.setDefaultOptionProvider(undefined);
        AutomaticSettings.Trigger.unregisterAll();

        AddonSettingsStub.stubAllStorageApis();
    });

    afterEach(function() {
        sinon.restore();
        HtmlMock.cleanup();
        AddonSettingsStub.afterTest();
    });

    /**
     * Change an option as a user would do it. This triggers the "input" event.
     *
     * @public
     * @function
     * @param {string} elementId element ID to change
     * @param {string} [valueToPass] a string to change th value, if not passed it is omitted
     * @returns {InputEvent}
     */
    function changeExampleOptionInput(elementId, valueToPass) {
        const elOption = document.getElementById(elementId);
        if (valueToPass !== undefined) {
            elOption.value = valueToPass;
        }

        // trigger new input event
        const inputEvent = new InputEvent("input");
        elOption.dispatchEvent(inputEvent);

        return inputEvent;
    }

    /**
     * Change an option as a user would do it. This triggers the "change" event.
     *
     * @public
     * @function
     * @param {string} optionId element ID to change
     * @param {string} [valueToPass] a string to change th value, if not passed it is omitted
     * @returns {InputEvent}
     */
    function changeExampleOptionChange(optionId, valueToPass) {
        const elOption = document.getElementById(optionId);
        if (valueToPass !== undefined) {
            elOption.value = valueToPass;
        }

        // trigger new input event
        const inputEvent = new InputEvent("change");
        elOption.dispatchEvent(inputEvent);

        return inputEvent;
    }

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
            sinon.assert.calledWithExactly(defaultOptionProvider.firstCall, "greatSettingsNum");

            // assert that value of option has been set
            chai.assert.strictEqual(document.getElementById("greatSettingsNum").value, "777", "set value of option altghough it was expected not to set it");
        });

        it("does not do anything if not used and value is set in code", async function () {
            await AddonSettingsStub.stubSettings({});

            const originalHtml = HtmlMock.stripAllNewlines(`<p>nothing special</p>
            <li><label for="greatSettingsNum">greatSettingsNum</label>
            <input class="setting" id="greatSettingsNum" name="greatSettingsNum" value="123" type="number">
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
            <li><label for="testSetting">greatSettingsNum</label>
            <input class="leetCauseIwantIt" id="testSetting" name="greatSettingsNum" type="number">
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
            chai.assert.strictEqual(document.getElementById("testSetting").value, "", "set value of option altghough it was expected not to set it");
        });

        it("sets input type=number correctly", function () {
            return testOptionType(`
            <li><label for="testSetting">greatSettingsNum</label>
            <input class="setting" id="testSetting" name="greatSettingsNum" type="number">
            </li>`, "greatSettingsNum", "testSetting", "1234");
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
                <input class="setting" id="checkOkay" name="enableExample" type="checkbox">
                <label for="checkOkay">activate or disable a thing</label>
            </li>`, "enableExample", "checkOkay", true, (elOption) => {
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
            </li>`, "select", "selection", "Q", (elOption) => {
                chai.assert.strictEqual(elOption.querySelector('option[value="L"]').selected, false, "did not set value of select option[value=L] correctly");
                chai.assert.strictEqual(elOption.querySelector('option[value="M"]').selected, false, "did not set value of select option[value=M] correctly");
                chai.assert.strictEqual(elOption.querySelector('option[value="Q"]').selected, true, "did not set value of select option[value=Q] correctly");
                chai.assert.strictEqual(elOption.querySelector('option[value="H"]').selected, false, "did not set value of select option[value=H] correctly");
            });
        });

        it("sets radiogroup (fieldset) value correctly", async function () {
            // a data-name in fieldset could simplify the process, but we use the hard way, here
            await setOptionTest(`<li>
            <fieldset id="sizeRadioOptions" data-type="radiogroup" class="setting">
                <legend >set mode</legend>
                <ul>
                    <li>
                        <input id="sizeOne" type="radio" name="sizeType" value="oneValue">
                        <label for="sizeOne">Size one</label>

                        <input class="notASetting" type="number" id="unrelatedOption" name="uugh">
                        <span>px</span>
                    </li>

                    <li>
                        <input id="sizeTwo" type="radio" name="sizeType" value="twoValue">
                        <label for="sizeTwo">Size two</label>
                    </li>

                    <li>
                        <input id="sizeThree" type="radio" name="sizeType" value="threeValue">
                        <label for="sizeThree">Size three</label>
                    </li>
                </ul>
            </fieldset>
            </li>`, "sizeType", "sizeRadioOptions", "twoValue");

            // assert that HTML code has not been changed
            chai.assert.strictEqual(document.getElementById("sizeOne").hasAttribute("checked"), false, "radio button #sizeOne is not unchecked");
            chai.assert.strictEqual(document.getElementById("sizeTwo").hasAttribute("checked"), true, "radio button #sizeTwo is not checked");
            chai.assert.strictEqual(document.getElementById("sizeThree").hasAttribute("checked"), false, "radio button #sizeOne is not unchecked");
        });
    });

    describe("reset button", function() {

        /**
         * Sets up the option HTML code to test.
         *
         * @public
         * @function
         * @param {string} optionId
         * @param {string} [addClass] set to class to add to input element
         * @param {string} [optionName] element option to use for saving
         * @returns {string} the HTML
         */
        function buildHtmlOption(optionId, addClass = "", optionName = optionId) {
            return HtmlMock.stripAllNewlines(`
            <li>
                <input class="setting ${addClass}" id="${optionId}" type="text" name="${optionName}">
                <label for="${optionId}">this is an example setting</label>
            </li>`);
        }

        /* eslint-disable mocha/no-setup-in-describe */
        const SUCCESS_MESSAGE = HtmlMock.stripAllNewlines(`
            <div id="messageSuccess" class="message-box success invisible fade-hide">
                <span class="message-text">That worked!</span>
                <a href="#">
                    <button class="message-action-button micro-button success invisible"></button>
                </a>
                <img class="icon-dismiss invisible" src="/common/img/close.svg" width="24" height="24" tabindex="0" data-i18n data-i18n-aria-label="__MSG_dismissIconDescription__"></span>
            </div>
            `);
        /* eslint-enable mocha/no-setup-in-describe */

        it("resets options on reset button click", async function() {
            const optionMapping = {
                firstText: "1:ftOption543534",
                secondTextOption: "2nd:okayAnother432453",
                anotherOne: "3rd:anotherOne",
            };
            AddonSettingsStub.stubSettings(optionMapping);

            const optionMappingDefault = {
                firstText: "1:DEFAULT99",
                secondTextOption: "2nd:defaulOther",
                anotherOne: "3rd:defaultAgain",
            };

            // set HTML code
            let html = buildHtmlOption("firstText");
            html += buildHtmlOption("secondTextOption");
            html += buildHtmlOption("anotherOne");

            // reset button
            html += '<button type="button" name="reset-button" id="resetButton">Reset</button>';

            HtmlMock.setTestHtml(html);

            // set default values (this time only defaults)
            AutomaticSettings.setDefaultOptionProvider((option) => {
                switch (option) {
                case "firstText":
                    return optionMappingDefault.firstText;
                case "secondTextOption":
                    return optionMappingDefault.secondTextOption;
                case "anotherOne":
                    return optionMappingDefault.anotherOne;
                default:
                    throw new Error(`default option provider was provided with invalid option ${option}.`);
                }
            });

            // verify requirement that data is set from synced settings
            await AutomaticSettings.init();
            Object.entries(optionMapping).forEach(([key, value]) => {
                chai.assert.strictEqual(
                    document.querySelector(`[name=${key}]`).value,
                    value,
                    `option ${key} did not had correct value loading from settings before reset button is clicked`
                );
            });

            // trigger reset button
            document.getElementById("resetButton").click();

            // assert that trigger was called correctly
            await AutomaticSettings.init();
            Object.entries(optionMappingDefault).forEach(([key, value]) => {
                chai.assert.strictEqual(
                    document.querySelector(`[name=${key}]`).value,
                    value,
                    `option ${key} did not had correct value after reset button has been clicked`
                );
            });
        });

        it("resetting undo works", async function() {
            const optionMapping = {
                firstText: "1:ftOption543534",
                secondTextOption: "2nd:okayAnother432453",
                anotherOne: "3rd:anotherOne",
            };
            AddonSettingsStub.stubSettings(optionMapping);

            const optionMappingDefault = {
                firstText: "1:DEFAULT99",
                secondTextOption: "2nd:defaulOther",
                anotherOne: "3rd:defaultAgain",
            };

            // set HTML code
            let html = SUCCESS_MESSAGE;
            html += buildHtmlOption("firstText");
            html += buildHtmlOption("secondTextOption");
            html += buildHtmlOption("anotherOneId", "save-on-input", "anotherOne");

            // reset button
            html += '<button type="button" name="reset-button" id="resetButton">Reset</button>';

            HtmlMock.setTestHtml(html);

            // set default values (this time only defaults)
            AutomaticSettings.setDefaultOptionProvider((option) => {
                switch (option) {
                case "firstText":
                    return optionMappingDefault.firstText;
                case "secondTextOption":
                    return optionMappingDefault.secondTextOption;
                case "anotherOne":
                    return optionMappingDefault.anotherOne;
                default:
                    throw new Error(`default option provider was provided with invalid option ${option}.`);
                }
            });

            // startup
            MessageHandler.init();
            await AutomaticSettings.init();

            // change some data
            optionMapping.anotherOne = "changedAfterOptionsLoadedButBeforeReset";
            changeExampleOptionInput("anotherOneId", optionMapping.anotherOne);
            await wait(5);

            // trigger reset button
            document.getElementById("resetButton").click();
            await wait(5);

            // assert that data was reset to defaults
            Object.entries(optionMappingDefault).forEach(([key, value]) => {
                chai.assert.strictEqual(
                    document.querySelector(`[name=${key}]`).value,
                    value,
                    `option ${key} did not had correct value after reset button has been clicked`
                );
            });

            // trigger undo button of message
            document.querySelector("#messageSuccess .message-action-button").click();
            await wait(5);

            // verify that data is back to previous one
            Object.entries(optionMapping).forEach(([key, value]) => {
                chai.assert.strictEqual(
                    document.querySelector(`[name=${key}]`).value,
                    value,
                    `option ${key} did not had correct value after undoing`
                );
            });
        });

        it("before/after load triggers run on option reset", async function() {
            AutomaticSettings.Trigger.unregisterAll();
            AddonSettingsStub.stubSettings({
                exampleOption: "optionLoaded"
            });

            // test HTML
            let html = SUCCESS_MESSAGE;
            html += buildHtmlOption("exampleOption");
            html += '<button type="button" name="reset-button" id="resetButton">Reset</button>';

            HtmlMock.setTestHtml(html);

            // startup
            MessageHandler.init();
            AutomaticSettings.setDefaultOptionProvider(() => "resetOptionToDefault");
            await AutomaticSettings.init();

            const checkOptionLoaded = () => {
                // check, the option for "okayExOption" really has not been changed
                const elOption = document.getElementById("exampleOption");
                chai.assert.strictEqual(elOption.value, "optionLoaded", "option has already been changed");
            };
            const checkOptionResetToDefault = () => {
                // check, the option for "okayExOption" really has not been changed
                const elOption = document.getElementById("exampleOption");
                chai.assert.strictEqual(elOption.value, "resetOptionToDefault", "option has not been replaced by default value");
            };

            // set up triggers
            const beforeLoad = sinon.stub().callsFake(checkOptionLoaded);
            AutomaticSettings.Trigger.registerBeforeLoad(beforeLoad);

            const aterLoad = sinon.stub().callsFake(checkOptionResetToDefault);
            AutomaticSettings.Trigger.registerAfterLoad(aterLoad);

            // trigger reset button
            document.getElementById("resetButton").click();

            await wait(5);

            // assert that trigger was called correctly
            sinon.assert.calledOnce(beforeLoad);
            sinon.assert.calledOnce(aterLoad);
            sinon.assert.calledWithExactly(beforeLoad.firstCall); // i.e. no arguments
            sinon.assert.calledWithExactly(aterLoad.firstCall); // i.e. no arguments
        });

    });

    describe("Trigger", function () {
        const EXAMPLE_OPTION_VALUE = "valueLoadedFromDefaults";

        /**
         * Sets up the option HTML code to test.
         *
         * @public
         * @function
         * @param {string} optionName
         * @param {string} [addClass] set to class to add to input element
         * @param {string} [optionId] element ID to set
         * @returns {void}
         */
        function setExampleOption(optionName, addClass = "", optionId = `${optionName}Id`) {
            const originalHtml = HtmlMock.stripAllNewlines(`
            <li>
                <input class="setting ${addClass}" id="${optionId}" name="${optionName}" type="text">
                <label for="${optionId}">this is an example setting</label>
            </li>`);
            HtmlMock.setTestHtml(originalHtml);

            // setup default option provider for providing settings (mocking AddonSettings would also be possible)
            AutomaticSettings.setDefaultOptionProvider((option) => {
                if (option !== optionName) {
                    throw new Error(`setExampleOption default option provider was provided with invalid option ${option}.`);
                }

                // load this value
                return EXAMPLE_OPTION_VALUE;
            });
        }

        describe("registerBeforeLoad", function () {
            it("trigger before load works", async function() {
                // set up triggers
                const beforeLoad = sinon.stub().callsFake(() => {
                    debugger;
                    // check, the option for "okayExOption" really has not been changed
                    const elOption = document.getElementById("okayId");
                    chai.assert.strictEqual(elOption.value, "", "option has already been changed/loaded while it should not");
                });
                AutomaticSettings.Trigger.registerBeforeLoad(beforeLoad);

                setExampleOption("okayExOption", "", "okayId");

                await AutomaticSettings.init();

                // assert that trigger was called correctly
                sinon.assert.calledOnce(beforeLoad);
                sinon.assert.calledWithExactly(beforeLoad.firstCall); // i.e. no arguments
            });

            it("triggers multiple triggers", async function() {
                const triggerCheck = () => {
                    // check, the option for "okayExOption" really has not been changed
                    const elOption = document.getElementById("okayId");
                    chai.assert.strictEqual(elOption.value, "", "option has already been changed/loaded while it should not");
                }

                // set up triggers
                const beforeLoad1 = sinon.stub().callsFake(triggerCheck);
                const beforeLoad2 = sinon.stub().callsFake(triggerCheck);
                AutomaticSettings.Trigger.registerBeforeLoad(beforeLoad1);
                AutomaticSettings.Trigger.registerBeforeLoad(beforeLoad2);

                setExampleOption("okayExOption", "", "okayId");

                await AutomaticSettings.init();

                // assert that trigger was called correctly
                sinon.assert.calledOnce(beforeLoad1);
                sinon.assert.calledOnce(beforeLoad2);
                sinon.assert.calledWithExactly(beforeLoad1.firstCall); // i.e. no arguments
                sinon.assert.calledWithExactly(beforeLoad2.firstCall); // i.e. no arguments
            });
        });

        describe("registerAfterLoad", function () {
            it("trigger after load works", async function() {
                // set up triggers
                const afterLoad = sinon.stub().callsFake(() => {
                    // check, the option for "okayExOption" really has not been changed
                    const elOption = document.getElementById("okayId");
                    chai.assert.strictEqual(elOption.value, EXAMPLE_OPTION_VALUE, "option has not yet been loaded while it should have been");
                });
                AutomaticSettings.Trigger.registerAfterLoad(afterLoad);

                setExampleOption("okayExOption", "", "okayId");

                await AutomaticSettings.init();

                // assert that trigger was called correctly
                sinon.assert.calledOnce(afterLoad);
                sinon.assert.calledWithExactly(afterLoad.firstCall); // i.e. no arguments
            });

            it("triggers multiple triggers", async function() {
                const triggerCheck = () => {
                    // check, the option for "okayExOption" really has not been changed
                    const elOption = document.getElementById("okayId");
                    chai.assert.strictEqual(elOption.value, EXAMPLE_OPTION_VALUE, "option has not yet been loaded while it should have been");
                };

                // set up triggers
                const afterLoad1 = sinon.stub().callsFake(triggerCheck);
                const afterLoad2 = sinon.stub().callsFake(triggerCheck);
                AutomaticSettings.Trigger.registerAfterLoad(afterLoad1);
                AutomaticSettings.Trigger.registerAfterLoad(afterLoad2);

                setExampleOption("okayExOption", "", "okayId");

                await AutomaticSettings.init();

                // assert that trigger was called correctly
                sinon.assert.calledOnce(afterLoad1);
                sinon.assert.calledOnce(afterLoad2);
                sinon.assert.calledWithExactly(afterLoad1.firstCall); // i.e. no arguments
                sinon.assert.calledWithExactly(afterLoad2.firstCall); // i.e. no arguments
            });

            it("runs all save triggers if RUN_ALL_SAVE_TRIGGER is set for registerAfterLoad", async function() {
                // need to provide default options so processing does not fail
                await AddonSettingsStub.stubSettings({
                    bla: "yesBla",
                    exam: "yesExam",
                    good: "good"
                });

                const spyExam = sinon.spy();
                const spyBla1 = sinon.spy();
                const spyBla2 = sinon.spy();
                const spyGood = sinon.spy();

                AutomaticSettings.Trigger.registerSave("exam", spyExam);
                AutomaticSettings.Trigger.registerSave("bla", spyBla1);
                AutomaticSettings.Trigger.registerSave("bla", spyBla2);
                AutomaticSettings.Trigger.registerSave("good", spyGood);

                AutomaticSettings.Trigger.registerAfterLoad(AutomaticSettings.Trigger.RUN_ALL_SAVE_TRIGGER);

                // not really needed as it loads options even if there are actually none to load
                setExampleOption("okayExOption", "");

                await AutomaticSettings.init();

                // assert that triggers were called correctly
                sinon.assert.calledOnce(spyExam);
                sinon.assert.calledOnce(spyBla1);
                sinon.assert.calledOnce(spyBla2);
                sinon.assert.calledOnce(spyGood);
            });
        });

        describe("manual triggers", function () {
            it("manual trigger on update works", async function() {
                // set up triggers
                const spy = sinon.spy();
                AutomaticSettings.Trigger.registerUpdate("okayExOption", spy);

                setExampleOption("okayExOption", "trigger-on-update", "okayId");

                await AutomaticSettings.init();

                // change setting to trigger trigger
                const eventTrigger = changeExampleOptionInput("okayId", "testValue123");

                // assert that trigger was called correctly
                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy.firstCall, "testValue123", "okayExOption", eventTrigger);
            });

            it("manual trigger on change works", async function() {
                // set up triggers
                const spy = sinon.spy();
                AutomaticSettings.Trigger.registerChange("okayExOption", spy);

                setExampleOption("okayExOption", "trigger-on-change", "okayId");

                await AutomaticSettings.init();

                // change setting to trigger trigger
                const eventTrigger = changeExampleOptionChange("okayId", "testValue123");

                // assert that trigger was called correctly
                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy.firstCall, "testValue123", "okayExOption", eventTrigger);
            });

            it("multiple triggers on change and update work", async function() {
                // set up triggers
                const change1 = sinon.spy();
                const change2 = sinon.spy();
                AutomaticSettings.Trigger.registerChange("okayExOption", change1);
                AutomaticSettings.Trigger.registerChange("okayExOption", change2);

                const update1 = sinon.spy();
                const update2 = sinon.spy();
                AutomaticSettings.Trigger.registerUpdate("okayExOption", update1);
                AutomaticSettings.Trigger.registerUpdate("okayExOption", update2);

                setExampleOption("okayExOption", "trigger-on-change trigger-on-update", "okayId");

                await AutomaticSettings.init();

                // change setting to trigger triggers
                const eventTriggerChange = changeExampleOptionChange("okayId", "newValueOnChange");
                const eventTriggerUpdate = changeExampleOptionInput("okayId", "newValueOnInput/Update");

                // assert that trigger was called correctly
                sinon.assert.calledOnce(change1);
                sinon.assert.calledWithExactly(change1.firstCall, "newValueOnChange", "okayExOption", eventTriggerChange);
                sinon.assert.calledOnce(change2);
                sinon.assert.calledWithExactly(change2.firstCall, "newValueOnChange", "okayExOption", eventTriggerChange);

                sinon.assert.calledOnce(update1);
                sinon.assert.calledWithExactly(update1.firstCall, "newValueOnInput/Update", "okayExOption", eventTriggerUpdate);
                sinon.assert.calledOnce(update2);
                sinon.assert.calledWithExactly(update2.firstCall, "newValueOnInput/Update", "okayExOption", eventTriggerUpdate);
            });
        });

        describe("save trigger", function () {
            it("save trigger on input works", async function() {
                // set up triggers
                const spy = sinon.spy();
                AutomaticSettings.Trigger.registerSave("okayExOption", spy);

                setExampleOption("okayExOption", "save-on-input", "okayId");

                await AutomaticSettings.init();

                // change setting to trigger trigger
                changeExampleOptionInput("okayId", "testValue123");

                // assert that trigger was called correctly
                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy.firstCall, "testValue123", "okayExOption");
            });

            it("save trigger on change works", async function() {
                // set up triggers
                const spy = sinon.spy();
                AutomaticSettings.Trigger.registerSave("okayExOption", spy);

                setExampleOption("okayExOption", "save-on-change", "okayId");

                await AutomaticSettings.init();

                // change setting to trigger trigger
                changeExampleOptionChange("okayId", "testValue123");

                // assert that trigger was called correctly
                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy.firstCall, "testValue123", "okayExOption");
            });

            it("save triggers on save does not trigger for wrong value", async function() {
                // set up triggers
                const saveTrigger = sinon.spy();
                AutomaticSettings.Trigger.registerSave("okayExOptionWRONG", saveTrigger);

                setExampleOption("okayExOption", "save-on-change", "okayId");

                await AutomaticSettings.init();

                // change setting to trigger trigger
                changeExampleOptionChange("okayId", "testValue123");

                // assert that trigger was called correctly
                sinon.assert.notCalled(saveTrigger);
            });

            it("save triggers on input does not trigger for wrong value", async function() {
                // set up triggers
                const saveTrigger = sinon.spy();
                AutomaticSettings.Trigger.registerSave("okayExOptionWRONG", saveTrigger);

                setExampleOption("okayExOption", "save-on-input", "okayId");

                await AutomaticSettings.init();

                // change setting to trigger trigger
                changeExampleOptionInput("okayId", "testValue123");

                // assert that trigger was called correctly
                sinon.assert.notCalled(saveTrigger);
            });
        });
    });

    describe("save settings", function () {
        /**
         * Sets up the option code to test.
         *
         * @public
         * @function
         * @param {string} htmlCode
         * @param {string} optionName
         * @param {string} optionId element ID to read value from
         * @param {any} startValue  inital value to set
         * @returns {Promise}
         */
        async function setupOptionToTest(htmlCode, optionName, optionId, startValue) {
            await AddonSettingsStub.stubSettings({
                [optionName]: startValue
            });

            const originalHtml = HtmlMock.stripAllNewlines(htmlCode);
            HtmlMock.setTestHtml(originalHtml);

            // setup default option provider
            AutomaticSettings.setDefaultOptionProvider(sinon.stub().returns(777));

            // run test
            await AutomaticSettings.init();

            return originalHtml;
        }

        it("saves input type=number correctly", async function () {
            await setupOptionToTest(`
            <li><label for="greatSettingsNum">greatSettingsNum</label>
            <input class="setting save-on-input" id="greatId" name="greatSettingsNum" type="number">
            </li>`, "greatSettingsNum", "greatId", "1234");

            // change option
            changeExampleOptionInput("greatId", 771615);

            await wait(5);

            // verify option is saved
            const newOption = await browser.storage.sync.get("greatSettingsNum");
            chai.assert.propertyVal(newOption, "greatSettingsNum", 771615);

            // also check for float and not integer
            changeExampleOptionInput("greatId", 12.345);

            await wait(5);

            // verify option is saved
            const newOptionFloat = await browser.storage.sync.get("greatSettingsNum");
            chai.assert.propertyVal(newOptionFloat, "greatSettingsNum", 12.345);
        });

        it("saves input type=text correctly", async function () {
            await setupOptionToTest(`
            <li><label for="greatSettings">test text type</label>
            <input class="setting save-on-input" id="greatId" name="greatSettings" type="text">
            </li>`, "greatSettings", "greatId", "blagood328!!!");

            // change option
            changeExampleOptionInput("greatId", "newString value !%&&");

            await wait(5);

            // verify option is saved
            const newOption = await browser.storage.sync.get("greatSettings");
            chai.assert.propertyVal(newOption, "greatSettings", "newString value !%&&");
        });

        it("saves input type=checkbox correctly", async function () {
            await setupOptionToTest(`
            <li>
                <input class="setting save-on-input" id="greatId" name="enableExample" type="checkbox">
                <label for="checkOkay">activate or disable a thing</label>
            </li>`, "enableExample", "greatId", false);

            // change option
            document.getElementById("greatId").checked = true;
            changeExampleOptionInput("greatId"); // only to trigger event

            await wait(5);

            // verify option is saved
            const newOption = await browser.storage.sync.get("enableExample");
            chai.assert.propertyVal(newOption, "enableExample", true);
        });

        it("saves select value correctly", async function () {
            await setupOptionToTest(`
            <li>
                <label for="selection">Select one thing: </label>
                <select id="selection" class="setting save-on-input" name="select" size="0">
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                </select>
            </li>`, "select", "selection", "Q");

            // change option
            const elOption = document.getElementById("selection");
            elOption.querySelector('option[value="H"]').selected = true;
            changeExampleOptionInput("selection"); // only to trigger event

            await wait(5);

            // verify option is saved
            const newOption = await browser.storage.sync.get("select");
            chai.assert.propertyVal(newOption, "select", "H");
        });

        it("saves fieldset (radiogroup) value correctly", async function () {
            await setupOptionToTest(`<li>
            <fieldset id="sizeGroup" data-type="radiogroup" class="setting save-on-input">
                <legend>set mode</legend>
                <ul>
                    <li>
                        <input id="sizeOne" type="radio" name="sizeType" value="oneValue">
                        <label for="sizeOne">Size one</label>

                        <input class="notASetting" type="number" id="unrelatedOption" name="uugh">
                        <span>px</span>
                    </li>

                    <li>
                        <input id="sizeTwo" type="radio" name="sizeType" value="twoValue">
                        <label for="sizeTwo">Size two</label>
                    </li>

                    <li>
                        <input id="sizeThree" type="radio" name="sizeType" value="threeValue">
                        <label for="sizeThree">Size three</label>
                    </li>
                </ul>
            </fieldset>
            </li>`, "sizeType", "sizeGroup", "twoValue");

            // change option
            document.getElementById("sizeTwo").removeAttribute("checked");
            document.getElementById("sizeThree").setAttribute("checked", true);
            changeExampleOptionInput("sizeGroup"); // only to trigger event

            await wait(5);

            // verify option is saved
            const newOption = await browser.storage.sync.get("sizeType");
            chai.assert.propertyVal(newOption, "sizeType", "threeValue");
        });
    });

    describe("option group", function () {
        /**
         * Sets up the option code to test.
         *
         * @public
         * @function
         * @param {string} htmlCode
         * @param {string} optionName
         * @param {string} optionId element ID to read value from
         * @param {any} startValue  inital value to set
         * @returns {Promise}
         */
        async function setupOptionToTest(htmlCode, optionName, optionId, startValue) {
            await AddonSettingsStub.stubSettings({
                [optionName]: startValue
            });

            const originalHtml = HtmlMock.stripAllNewlines(htmlCode);
            HtmlMock.setTestHtml(originalHtml);

            // setup default option provider
            AutomaticSettings.setDefaultOptionProvider(sinon.stub().returns(777));

            // run test
            await AutomaticSettings.init();

            return originalHtml;
        }

        /**
         * Sets up the one example option group we have.
         *
         * @public
         * @function
         * @returns {Promise}
         */
        async function setExampleOptionGroup() {
            await setupOptionToTest(`<li>
            <fieldset id="sizeType" data-type="radiogroup" data-optiongroup="goodOptions" class="setting save-on-input">
                <legend >set mode</legend>
                <ul>
                    <li>
                        <input id="sizeOne" type="radio" name="sizeType" value="oneValue">
                        <label for="sizeOne">Size one</label>

                        <input class="setting save-on-input" type="number" data-optiongroup="goodOptions" name="partialSetting" id="partialSettingId">
                        <span>px</span>
                    </li>

                    <li>
                        <input id="sizeTwo" type="radio" name="sizeType" value="twoValue">
                        <label for="sizeTwo">Size two</label>
                    </li>

                    <li>
                        <input id="sizeThree" type="radio" name="sizeType" value="threeValue">
                        <label for="sizeThree">Size three</label>
                    </li>
                </ul>
            </fieldset>
            </li>
            <li>
                <input class="setting save-on-input" data-optiongroup="goodOptions" type="text" name="anotherSetting" id="anotherOption">
            </li>`, "goodOptions", "", {
                sizeType: "oneValue",
                partialSetting: 8421,
                anotherSetting: "withSomeText"
            });
        }

        it("sets option group values correctly", async function () {
            await setExampleOptionGroup();

            // check that they were loaded correctly
            chai.assert.strictEqual(document.getElementById("sizeOne").hasAttribute("checked"), true, "radio button #sizeOne is not checked");
            chai.assert.strictEqual(document.getElementById("sizeTwo").hasAttribute("checked"), false, "radio button #sizeTwo is not unchecked");
            chai.assert.strictEqual(document.getElementById("sizeThree").hasAttribute("checked"), false, "radio button #sizeOne is not unchecked");

            chai.assert.strictEqual(document.getElementById("anotherOption").value, "withSomeText", "did not set text value of anotherSetting correctly");

            chai.assert.strictEqual(document.getElementById("partialSettingId").value, "8421", "did not set numeric value of partialSetting correctly");
        });


        it("saves option group values correctly", async function () {
            await setExampleOptionGroup();

            // change option
            document.getElementById("sizeOne").removeAttribute("checked");
            document.getElementById("sizeThree").setAttribute("checked", true);
            changeExampleOptionInput("sizeType"); // only to trigger event

            await wait(5);

            // verify option is saved
            const newOptionRadio = await browser.storage.sync.get("goodOptions");
            chai.assert.deepNestedPropertyVal(newOptionRadio, "goodOptions.sizeType", "threeValue");

            // change option
            changeExampleOptionInput("anotherOption", "newTextOption");

            await wait(5);

            // verify option is saved
            const newOptionText = await browser.storage.sync.get("goodOptions");
            chai.assert.deepNestedPropertyVal(newOptionText, "goodOptions.anotherSetting", "newTextOption");

            // change option
            changeExampleOptionInput("partialSettingId", 99.99);

            await wait(5);

            // verify option is saved
            const newOptionNumber = await browser.storage.sync.get("goodOptions");
            chai.assert.deepNestedPropertyVal(newOptionNumber, "goodOptions.partialSetting", 99.99);

            // finally compare whole object
            chai.assert.deepEqual(newOptionNumber.goodOptions, {
                sizeType: "threeValue",
                partialSetting: 99.99,
                anotherSetting: "newTextOption"
            });
        });
    });
});
