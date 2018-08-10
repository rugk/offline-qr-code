import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.4/pkg/sinon.js"; /* globals sinon */

import * as HtmlMock from "./htmlMock.js";

import * as Localiser from "/common/modules/Localiser.js";

describe("common module: Localiser", function () {
    before(function () {
        // Mocked function needs to be accessed at least once to get initiated and not be just a getter/property.
        // Otherwise "TypeError: Attempted to wrap undefined property getUILanguage as functioncheckWrappedMethod" is shown.
        // See https://discourse.mozilla.org/t/webextension-apis-made-as-getter-setter-lazily-evaluating-to-functions-beware-of-mocking-for-unit-tests/30849

        /* eslint-disable no-unused-expressions */
        browser.i18n.getUILanguage; // not actually needed, as getUILanguage is automatically accessed before anyway in the Localiser module
        browser.i18n.getMessage;
        /* eslint-enable no-unused-expressions */
    });

    describe("init() – basic", function () {
        it("replaces html lang attribute", function () {
            const mockI18n = sinon.mock(browser.i18n);

            /* eslint-disable indent */
            mockI18n.expects("getUILanguage")
                    .once().withArgs()
                    .returns("EXA-01");
            Localiser.init();

            chai.assert.strictEqual(document.querySelector("html").getAttribute("lang"), "EXA-01", "did not set language code correctly");

            // verify results
            mockI18n.verify();
        });
    });

    describe("init() – text replacement", function () {
        /**
         * Verify the text is replaced in the HTML.
         *
         * @function
         * @private
         * @param {string} messageName
         * @param {string} [wholeString=] (optional)
         * @param {string} [localizedValue="VALID REPLACEMENT VALUE"] (optional) the localized string/message
         * @param {string} [expectedResult=[localizedValue]] (optional) the expected replacement
         * @returns {void}
         */
        function testReplacesText(messageName, wholeString = `__MSG_${messageName}__`,
            localizedValue = "VALID REPLACEMENT VALUE", expectedResult = localizedValue
        ) {
            HtmlMock.setTestHtml(`<span id="testElement" data-i18n="${wholeString}">Hardcoded Fallback Value!</span>`);

            const mockI18n = sinon.mock(browser.i18n);

            /* eslint-disable indent */
            mockI18n.expects("getMessage")
                    .once().withArgs(messageName)
                    .returns(localizedValue);

            // run test
            Localiser.init();

            // verify results
            mockI18n.verify();

            const replacedString = document.getElementById("testElement").innerHTML;
            chai.assert.strictEqual(replacedString, expectedResult, `did not replace span with correct content for message ID "${messageName}"`);
        }

        /**
         * Verify the text is not replaced in the HTML.
         *
         * @function
         * @private
         * @param {string} messageName
         * @param {string} [wholeString=] (optional)
         * @returns {void}
         */
        function testDoesNotReplaceText(messageName, wholeString = `__MSG_${messageName}__`) {
            HtmlMock.setTestHtml(`<span id="testElement" data-i18n="${wholeString}">Hardcoded Fallback Value!</span>`);

            const mockI18n = sinon.mock(browser.i18n);

            /* eslint-disable indent */
            mockI18n.expects("getMessage")
                    .never();

            // run test
            Localiser.init();

            // verify results
            mockI18n.verify();

            const replacedString = document.getElementById("testElement").innerHTML;
            chai.assert.strictEqual(replacedString, "Hardcoded Fallback Value!", `incorrectly replaced span for message ID "${messageName}"`);
        }

        it("replaces simple alphanumeric message IDs in data-i18n", function () {
            testReplacesText("extensionNameShort");
            testReplacesText("AnotherGoodExample");
            testReplacesText("AndSomeNumbers01234");
            testReplacesText("08234");
        });

        it("replaces message IDs with underscores in data-i18n", function () {
            testReplacesText("We_have_underscores__here___many____");
            testReplacesText("_yep_this_is_valid_");
        });

        it("replaces message IDs in data-i18n", function () {
            testReplacesText("with@message");
        });

        it("does not replace invalid message IDs in data-i18n", function () {
            testDoesNotReplaceText("invalid//ID");
            testDoesNotReplaceText("some spaces in here");
            testDoesNotReplaceText("some spaces in here");
        });

        it("does not replace message IDs which do not follow the _MSG__name__ format in data-i18n", function () {
            // missed char
            testDoesNotReplaceText("ledgitName", "__MSG_ledgitName_");
            testDoesNotReplaceText("ledgitName", "_MSG_ledgitName__");
            testDoesNotReplaceText("ledgitName", "_MSG_ledgitName_");

            // others
            testDoesNotReplaceText("ledgitName", "__MSGledgitName__");
            testDoesNotReplaceText("ledgitName", "__msg_ledgitName__");
        });

        it("does not evaluate HTML format in data-i18n", function () {
            // WARNING: Security-relevant test!
            testReplacesText("someId", undefined, "<b>bold text</b>", "&lt;b&gt;bold text&lt;/b&gt;");
            testReplacesText("someId", undefined, "<div>ok</div>", "&lt;div&gt;ok&lt;/div&gt;");
        });
    });

    afterEach(function() {
        sinon.restore();
        HtmlMock.cleanup();
    });
});
