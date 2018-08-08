import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.4/pkg/sinon.js"; /* globals sinon */

import {setTestHtml} from "./htmlMock.js";

function createDocElement(elemName) {
    const node = document.createElement(elemName);
    const div = document.createElement("div");
}

import * as Localiser from "/common/modules/Localiser.js";

describe("common module: Localiser", function () {
    describe("init()", function () {
        it("replaces html lang attribute", function () {
            const stubGetUiLang = sinon.stub().returns("EXA-01");
            browser.i18n.getUILanguage = stubGetUiLang;

            Localiser.init();

            chai.assert.strictEqual(document.querySelector("html").getAttribute("lang"), "EXA-01", "did not set language code correctly");
            chai.assert(stubGetUiLang.calledOnceWithExactly(), "i18n.getUILanguage was not called correctly");
        });

        it("replaces '__MSG_extensionNameShort__' as text content", function () {
            setTestHtml('<span id="testExtensionName" class="message-text" data-i18n="__MSG_extensionNameShort__">What is my name?</span>');
            const stubGetMessage = sinon.stub().withArgs("extensionNameShort").returns("My fake extension name 101");
            browser.i18n.getMessage = stubGetMessage;

            Localiser.init();

            chai.assert(stubGetMessage.calledOnceWithExactly("extensionNameShort"), "i18n.getMessage was not called correctly");
            chai.assert.strictEqual(document.getElementById("testExtensionName").innerHTML, "My fake extension name 101", "did not replace span with correct content");
        });
    });

    afterEach(() => {
      // restore the default sandbox
      sinon.restore();
    });

});
