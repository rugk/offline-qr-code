import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.4/pkg/sinon.js"; /* globals sinon */

import {setTestHtml} from "./htmlMock.js";

import * as Logger from "/common/modules/Logger.js";
import * as Localiser from "/common/modules/Localiser.js";

describe("common module: Localiser", function () {
    describe("init() – basic", function () {
        it("replaces html lang attribute", function () {
            // Logger.logError(browser.i18n);
            const mockI18n = sinon.mock(browser.i18n);
            /* eslint-disable indent */
            mockI18n.expects("getUILanguage")
                    .once().withArgs()
                    .returns("EXA-01");

            Localiser.init();

            chai.assert.strictEqual(document.querySelector("html").getAttribute("lang"), "EXA-01", "did not set language code correctly");

            // verify results
            // Logger.logError(browser.i18n);
            mockI18n.verify();
            Logger.logError(browser.i18n);
        });
    });

    describe("init() – text replacement", function () {
        it("replaces '__MSG_extensionNameShort__' as text content", function () {
            setTestHtml('<span id="testExtensionName" class="message-text" data-i18n="__MSG_extensionNameShort__">What is my name?</span>');
            console.log(browser.i18n);
            const mockI18n = sinon.mock(browser.i18n);
            /* eslint-disable indent */
            mockI18n.expects("getMessage")
                    .once().withArgs("extensionNameShort")
                    .returns("My fake extension name 101");

            // run test
            Localiser.init();

            // verify results
            mockI18n.verify();

            const replacedString = document.getElementById("testExtensionName").innerHTML;
            chai.assert.strictEqual(replacedString, "My fake extension name 101", "did not replace span with correct content");
        });

        it("replaces '__MSG_fake-Translation-ID-9831278__' as text content", function () {
            setTestHtml('<span id="testBadString" class="message-text" data-i18n="__MSG_fake-Translation-ID-9831278__">N/A</span>');
            const mockI18n = sinon.mock(browser.i18n);
            /* eslint-disable indent */
            mockI18n.expects("getMessage")
                    .once().withArgs("fake-Translation-ID-9831278")
                    .returns("Yes, correct!");

            // run test
            Localiser.init();

            // verify results
            mockI18n.verify();

            const replacedString = document.getElementById("testBadString").innerHTML;
            chai.assert.strictEqual(replacedString, "Yes, correct!", "did not replace span with correct content");
        });
    });

    afterEach(function() {
        sinon.restore();
    });
});
