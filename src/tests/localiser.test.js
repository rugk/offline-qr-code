import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as Localizer from "/common/modules/Localizer.js";

import * as HtmlMock from "./modules/HtmlMock.js";

const TEST_ATTRIBUTES = [
    "placeholder",
    "alt",
    "href",
    "aria-label"
];

describe("common module: Localizer", function () {
    before(function () {
        // Mocked function needs to be accessed at least once to get initiated and not be just a getter/property.
        // Otherwise "TypeError: Attempted to wrap undefined property getUILanguage as functioncheckWrappedMethod" is shown.
        // See https://discourse.mozilla.org/t/webextension-apis-made-as-getter-setter-lazily-evaluating-to-functions-beware-of-mocking-for-unit-tests/30849

        /* eslint-disable no-unused-expressions */
        browser.i18n.getUILanguage; // not actually needed, as getUILanguage is automatically accessed before anyway in the Localizer module
        browser.i18n.getMessage;
        /* eslint-enable no-unused-expressions */
    });

    afterEach(function() {
        sinon.restore();
        HtmlMock.cleanup();
    });

    /**
     * Verify the text is not replaced in the HTML.
     *
     * @function
     * @private
     * @param {string} messageName
     * @param {string} [wholeMsgString=] (optional)
     * @returns {void}
     */
    function testDoesNotReplaceText(messageName, wholeMsgString = `__MSG_${messageName}__`) {
        HtmlMock.setTestHtml(`<span id="testElement" data-i18n="${wholeMsgString}">Hardcoded Fallback Value!</span>`);

        const mockI18n = sinon.mock(browser.i18n);

        /* eslint-disable indent */
        mockI18n.expects("getMessage")
                .never();

        // run test
        Localizer.init();

        // verify results
        mockI18n.verify();

        const replacedString = document.getElementById("testElement").innerHTML;
        chai.assert.strictEqual(replacedString, "Hardcoded Fallback Value!", `incorrectly replaced span for message ID "${messageName}"`);
    }

    /**
     * Verify the text is replaced in the HTML.
     *
     * @function
     * @private
     * @param {string} messageName
     * @param {string} [wholeMsgString=] (optional)
     * @returns {void}
     */
    function testReplacesText(messageName, wholeMsgString = `__MSG_${messageName}__`) {
        HtmlMock.setTestHtml(`<span id="testElement" data-i18n="${wholeMsgString}">Hardcoded Fallback Value!</span>`);

        const mockI18n = sinon.mock(browser.i18n);

        /* eslint-disable indent */
        mockI18n.expects("getMessage")
                .once().withArgs(messageName)
                .returns("VALID REPLACEMENT VALUE");

        // run test
        Localizer.init();

        // verify results
        mockI18n.verify();

        // assert that value has been replaced correctly
        const replacedString = document.getElementById("testElement").innerHTML;
        chai.assert.strictEqual(replacedString, "VALID REPLACEMENT VALUE", `did not replace span with correct content for message ID "${messageName}"`);
    }

        /**
     * Runs tests with test strings to check whether it replaces them.
     *
     * @function
     * @private
     * @param {string} descrSuffix appended text to describtion of test cases
     * @param {function} testReplacesText the function to use for testing replacement
     * @param {function} testDoesNotReplaceText the function to use for testing "does not replace"
     * @returns {void}
     */
    function runReplaceTests(descrSuffix, testReplacesText, testDoesNotReplaceText) {
        it(`replaces simple alphanumeric message IDs ${descrSuffix}`, function () {
            testReplacesText("extensionNameShort");
            testReplacesText("AnotherGoodExample");
            testReplacesText("AndSomeNumbers01234");
            testReplacesText("08234");
        });

        it(`replaces message IDs with underscores${descrSuffix}`, function () {
            testReplacesText("We_have_underscores__here___many____");
            testReplacesText("_yep_this_is_valid_");
        });

        it(`replaces message IDs${descrSuffix}`, function () {
            testReplacesText("with@message");
        });

        it(`does not replace invalid message IDs${descrSuffix}`, function () {
            testDoesNotReplaceText("invalid//ID");
            testDoesNotReplaceText("some spaces in here");
            testDoesNotReplaceText("some spaces in here");
        });

        it(`does not replace message IDs which do not follow the _MSG__name__ format${descrSuffix}`, function () {
            // missed char
            testDoesNotReplaceText("ledgitName", "__MSG_ledgitName_");
            testDoesNotReplaceText("ledgitName", "_MSG_ledgitName__");
            testDoesNotReplaceText("ledgitName", "_MSG_ledgitName_");

            // others
            testDoesNotReplaceText("ledgitName", "__MSGledgitName__");
            testDoesNotReplaceText("ledgitName", "__msg_ledgitName__");
            testDoesNotReplaceText("ledgitName", ""); // completly missing ID
        });
    }

    describe("init() – basic", function () {
        it("sets html lang attribute", function () {
            const mockI18n = sinon.mock(browser.i18n);

            /* eslint-disable indent */
            mockI18n.expects("getUILanguage")
                    .once().withArgs()
                    .returns("EXA-01");
            Localizer.init();

            chai.assert.strictEqual(document.querySelector("html").getAttribute("lang"), "EXA-01", "did not set language code correctly");

            // verify results
            mockI18n.verify();
        });
    });

    describe("init() – text replacement", function () {
        runReplaceTests(" in data-i18n", testReplacesText, testDoesNotReplaceText); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("init() – attribute replacement", function () {
        /**
         * Verify the text is replaced in the attribute.
         *
         * @function
         * @private
         * @param {string} attribute
         * @param {string} messageName
         * @param {string} [wholeMsgString=] (optional)
         * @returns {void}
         */
        function testReplacesAttribute(attribute, messageName, wholeMsgString = `__MSG_${messageName}__`) {
            HtmlMock.setTestHtml(`<span id="testElement" data-i18n ${attribute}="Fallback value!" data-i18n-${attribute}="${wholeMsgString}"></span>`);

            const mockI18n = sinon.mock(browser.i18n);

            /* eslint-disable indent */
            mockI18n.expects("getMessage")
                    .once().withArgs(messageName)
                    .returns("VALID REPLACEMENT VALUE");

            // run test
            Localizer.init();

            // verify results
            mockI18n.verify();

            const replacedString = document.getElementById("testElement").getAttribute(attribute);
            chai.assert.strictEqual(replacedString, "VALID REPLACEMENT VALUE", `did not replace attribute "${attribute}" with correct content for message ID "${messageName}"`);
        }

        /**
         * Verify the text is not replaced in the attribute.
         *
         * @function
         * @private
         * @param {string} attribute
         * @param {string} messageName
         * @param {string} [wholeMsgString=] (optional)
         * @returns {void}
         */
        function testDoesNotReplaceAttribute(attribute, messageName, wholeMsgString = `__MSG_${messageName}__`) {
            HtmlMock.setTestHtml(`<span id="testElement" data-i18n ${attribute}="Hardcoded Fallback Value!" data-i18n-${attribute}="${wholeMsgString}"></span>`);

            const mockI18n = sinon.mock(browser.i18n);

            /* eslint-disable indent */
            mockI18n.expects("getMessage")
                    .never();

            // run test
            Localizer.init();

            // verify results
            mockI18n.verify();

            const replacedString = document.getElementById("testElement").getAttribute(attribute);
            chai.assert.strictEqual(replacedString, "Hardcoded Fallback Value!", `incorrectly replaced "${attribute}" for message ID "${messageName}"`);
        }

        // run tests for each test case for each attribute
        /* eslint-disable mocha/no-setup-in-describe */
        runReplaceTests(" in all attributes", function (localizedValue, expectedResult = undefined) {
            TEST_ATTRIBUTES.forEach((attribute) => {
                testReplacesAttribute(attribute, localizedValue, expectedResult);
            });
        }, function (localizedValue, expectedResult = undefined) {
            TEST_ATTRIBUTES.forEach((attribute) => {
                testDoesNotReplaceAttribute(attribute, localizedValue, expectedResult);
            });
        });
        /* eslint-enable mocha/no-setup-in-describe */
    });

    describe("init() – HTML replacement", function () {
        /**
         * Verify the text is replaced in the HTML.
         *
         * @function
         * @private
         * @param {string} localizedValue the localized string/message
         * @param {string} [expectedResult=[localizedValue]] (optional) the expected replacement
         * @returns {void}
         */
        function testReplaceValue(localizedValue, expectedResult = localizedValue) {
            HtmlMock.setTestHtml('<span id="testElement" data-i18n="__MSG_someId__">Hardcoded Fallback Value!</span>');

            const stub = sinon.stub(browser.i18n, "getMessage").returns(localizedValue);

            // run test
            Localizer.init();

            // "unstub"
            stub.restore();

            const replacedString = document.getElementById("testElement").innerHTML;
            chai.assert.strictEqual(replacedString, expectedResult);
        }

        /**
         * Verify the text is replaced in the HTML.
         *
         * @function
         * @private
         * @param {string} attribute
         * @param {string} localizedValue the localized string/message
         * @param {string} [expectedResult=[localizedValue]] (optional) the expected replacement
         * @returns {void}
         */
        function testReplaceAttribute(attribute, localizedValue, expectedResult = localizedValue) {
            HtmlMock.setTestHtml(`<span id="testElement" data-i18n ${attribute}="Fallback value!" data-i18n-${attribute}="__MSG_someId__"></span>`);

            const stub = sinon.stub(browser.i18n, "getMessage").returns(localizedValue);

            // run test
            Localizer.init();

            // "unstub"
            stub.restore();

            const replacedString = document.getElementById("testElement").getAttribute(attribute);
            chai.assert.strictEqual(replacedString, expectedResult, `did not replace attribute "${attribute}" correctly`);
        }

        it("does not evaluate HTML format in data-i18n", function () {
            // WARNING: Security-relevant test!
            testReplaceValue("<b>bold text</b>", "&lt;b&gt;bold text&lt;/b&gt;");
            testReplaceValue("<div>ok</div>", "&lt;div&gt;ok&lt;/div&gt;");
        });

        it("does evaluate HTML if specified in data-i18n", function () {
            testReplaceValue("!HTML! <b>bold text</b>", "<b>bold text</b>");
            testReplaceValue("!HTML! <div>ok</div>", "<div>ok</div>");
        });

        it("does strip/ignore \"!HTML!\" marker in attributes", function () {
            TEST_ATTRIBUTES.forEach((attribute) => {
                testReplaceAttribute(attribute, "!HTML! <b>bold text</b>", "<b>bold text</b>");
                testReplaceAttribute(attribute, "!HTML! <div>ok</div>", "<div>ok</div>");
            });
        });
    });

    describe("init() – no unexpected HTML modification", function () {
        /**
         * Verify the text is replaced in the HTML.
         *
         * @function
         * @private
         * @param {string} html the HTML to input
         * @param {string} resultHtml the expected HTML code
         * @param {string} localizedValue the localized string/message
         * @param {string} [htmlId="testElement"] the ID of the attached HTML element
         * @param {bool} [noCalling=false] when true, it additionally verifies that i18n.getMessage() is not called
         * @returns {void}
         */
        function testModifiesHtml(html, resultHtml, localizedValue, htmlId = "testElement", noCalling = false) {
            HtmlMock.setTestHtml(html);

            const stub = sinon.stub(browser.i18n, "getMessage").returns(localizedValue);

            // run test
            Localizer.init();

            // assert that element itself was not modified
            const wholeHtml = document.getElementById(htmlId).outerHTML;
            chai.assert.strictEqual(
                wholeHtml,
                resultHtml,
                "incorrectly modified HTML element while replacing"
            );

            if (noCalling) {
                sinon.assert.notCalled(stub);
            }

            // "unstub"
            stub.restore();
        }

        it("does not change HTML for non-existant message string", function () {
            const html1 = '<span id="testElement" data-i18n="__MSG_something__" alt="bla" data-i18n-alt="__MSG_something__">falling</span>';
            testModifiesHtml(html1, html1, "");
        });

        it("does not mangle with HTML with no (valid) replacement", function () {
            // no confusion should be possible
            const html1 = '<p id="noteTestMdn" class="note"><strong>Note:</strong> You shouldn\'t define names that start with @@. Such names are reserved for <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization#Predefined_messages">predefined messages</a>.</p>';
            testModifiesHtml(html1, html1, "BAD", "noteTestMdn", undefined, true);

            // could confuse with message tag strings shown somewhere else
            const html2 = '<span id="testElement" data-somewhere="__MSG_something__">some fallback value explaining __MSG_something__</span>';
            testModifiesHtml(html2, html2, "BAD", undefined, true);

            const html3 = '<span id="testElement" i18n="__MSG_something__"><p had="__MSG_something__"><img src="__MSG_something__"></p></span>';
            testModifiesHtml(html3, html3, "BAD", undefined, true);

            // with "" as messageName
            const html4 = '<span id="testElement" data-i18n="__MSG___" data-i18n-alt="__MSG___"></span>';
            testModifiesHtml(html4, html4, "BAD", undefined, true);

            // with wrongly positioned atttribute
            const html5 = '<span id="testElement">data-i18n="__MSG_something__"</span>';
            testModifiesHtml(html5, html5, "BAD", undefined, true);
        });

        it("does not mangle with with basic replacement", function () {
            testModifiesHtml(
                '<span id="testElement" data-i18n="__MSG_something__">some fallback value</span>',
                '<span id="testElement" data-i18n="__MSG_something__">ok</span>',
                "ok"
            );
            testModifiesHtml(
                '<div id="tstWrapper"><h2 data-i18n="__MSG_something__">some fallback value</h2></div>',
                '<div id="tstWrapper"><h2 data-i18n="__MSG_something__">ok</h2></div>',
                "ok",
                "tstWrapper"
            );
            testModifiesHtml(
                '<h2 data-i18n="__MSG_something__" id="testElement"><div>some fallback value</div></h2>',
                '<h2 data-i18n="__MSG_something__" id="testElement">ok</h2>',
                "ok"
            );
        });

        it("does not mangle with with __MSG_strings__ in unexpected positions when replacing", function () {
            // mentioned in text
            testModifiesHtml(
                '<span id="testElement" data-i18n="__MSG_something__">some fallback value explaining __MSG_something__</span>',
                '<span id="testElement" data-i18n="__MSG_something__">ok</span>',
                "ok"
            );
            // with unrelated p element
            testModifiesHtml(
                '<div id="testElement"><span data-i18n="__MSG_something__">some fallback value</span><p>__MSG_something__</p></div>',
                '<div id="testElement"><span data-i18n="__MSG_something__">ok</span><p>__MSG_something__</p></div>',
                "ok"
            );
            // with attributes
            testModifiesHtml(
                '<div id="testElement"><span data-i18n="__MSG_something__" data-i18n-alt="__MSG_something__" data-notreplace-i18n="__MSG_something__">fallback again</span><p>__MSG_something__</p></div>',
                '<div id="testElement"><span data-i18n="__MSG_something__" data-i18n-alt="__MSG_something__" data-notreplace-i18n="__MSG_something__" alt="ok">ok</span><p>__MSG_something__</p></div>',
                "ok"
            );
        });
    });

    describe("init() – fail-safety when one translation fails", function () {
        it("tries attribute localisation even when text localisation ID is incorrect", function () {
            for (const wholeMsgString of ["_MSG_123_", "__MSG___"]) {
                const html = `<span id="testElement" data-i18n="${wholeMsgString}" data-i18n-alt="__MSG_something__">fallback</span>`;
                HtmlMock.setTestHtml(html);

                const mockI18n = sinon.mock(browser.i18n);

                mockI18n.expects("getMessage").withArgs("something").once().returns("TRANSLATED");

                // run test
                Localizer.init();

                // assert that HTML code itself was not modified
                const wholeHtml = document.getElementById("testElement").outerHTML;
                chai.assert.strictEqual(
                    wholeHtml,
                    // attribute is translated, but not content
                    `<span id="testElement" data-i18n="${wholeMsgString}" data-i18n-alt="__MSG_something__" alt="TRANSLATED">fallback</span>`,
                    `did not correctly translate attribute, while keeping innerHTML (content) for ${wholeMsgString}`
                );

                // assert mock was correctly called
                mockI18n.verify();
            }
        });

        it("tries attribute localisation even when text localisation fails", function () {
            const html = '<span id="testElement" data-i18n="__MSG_NotExists__" data-i18n-alt="__MSG_something__">fallback</span>';
            HtmlMock.setTestHtml(html);

            const mockI18n = sinon.mock(browser.i18n);

            mockI18n.expects("getMessage").withArgs("NotExists").once().returns("");
            mockI18n.expects("getMessage").withArgs("something").once().returns("TRANSLATED");

            // run test
            Localizer.init();

            // assert that HTML code itself was not modified
            const wholeHtml = document.getElementById("testElement").outerHTML;
            chai.assert.strictEqual(
                wholeHtml,
                // attribute is translated, but not content
                '<span id="testElement" data-i18n="__MSG_NotExists__" data-i18n-alt="__MSG_something__" alt="TRANSLATED">fallback</span>',
                "did not correctly translate attribute, while keeping innerHTML (content)"
            );

            // assert mock was correctly called
            mockI18n.verify();
        });

        it("tries text localisation even when attribute localisation ID is incorrect", function () {
            for (const wholeMsgString of ["_MSG_123_", "__MSG___"]) {
                const html = `<span id="testElement" data-i18n="__MSG_something__" data-i18n-alt="${wholeMsgString}">fallback</span>`;
                HtmlMock.setTestHtml(html);

                const mockI18n = sinon.mock(browser.i18n);

                mockI18n.expects("getMessage").withArgs("something").once().returns("TRANSLATED");

                // run test
                Localizer.init();

                // assert that HTML code itself was not modified
                const wholeHtml = document.getElementById("testElement").outerHTML;
                chai.assert.strictEqual(
                    wholeHtml,
                    // attribute is translated, but not content
                    `<span id="testElement" data-i18n="__MSG_something__" data-i18n-alt="${wholeMsgString}">TRANSLATED</span>`,
                    `did not correctly translate innerHTML (content), while ignoring attribute for ${wholeMsgString}`
                );

                // assert mock was correctly called
                mockI18n.verify();
            }
        });

        it("tries text localisation even when attribute localisation fails", function () {
            const html = '<span id="testElement" data-i18n="__MSG_something__" data-i18n-alt="__MSG_NotExists__">fallback</span>';
            HtmlMock.setTestHtml(html);

            const mockI18n = sinon.mock(browser.i18n);

            mockI18n.expects("getMessage").withArgs("NotExists").once().returns("");
            mockI18n.expects("getMessage").withArgs("something").once().returns("TRANSLATED");

            // run test
            Localizer.init();

            // assert that HTML code itself was not modified
            const wholeHtml = document.getElementById("testElement").outerHTML;
            chai.assert.strictEqual(
                wholeHtml,
                // attribute is translated, but not content
                '<span id="testElement" data-i18n="__MSG_something__" data-i18n-alt="__MSG_NotExists__">TRANSLATED</span>',
                "did not correctly translate innerHTML (content), while ignoring attrbute"
            );

            // assert mock was correctly called
            mockI18n.verify();
        });
    });

    describe("init() – complex cases", function () {
        /**
         * Verify the text is replaced in the HTML.
         *
         * @function
         * @private
         * @param {string} htmlFile the HTML file to use as input
         * @param {string} resultHtmlFile the expected HTML file
         * @param {Object} [localizedValues={}] assignment of message strings to values
         * @param {function} [moreAssert=null] attach more assertion functions, the function gets passed the stub and localizedValues
         * @returns {Promise}
         */
        async function testModifiesHtmlFile(htmlFile, resultHtmlFile, localizedValues = {}, moreAssert = null) {
            await HtmlMock.setTestHtmlFile(htmlFile);
            const resultHtml = await HtmlMock.getTestHtmlFile(resultHtmlFile);

            const stub = sinon.stub(browser.i18n, "getMessage")
                        .callsFake((messageName) => localizedValues[messageName]);

            // run test
            Localizer.init();

            // assert that HTML code itself was correctly modified
            const wholeHtml = HtmlMock.getTestHtml();
            chai.assert.strictEqual(
                wholeHtml,
                resultHtml,
                "did not correctly localise HTML code"
            );

            if (moreAssert !== null) {
                moreAssert(stub, localizedValues);
            }

            // "unstub"
            stub.restore();
        }

        it("correctly localises QR code example", function () {
            return testModifiesHtmlFile("localizer/qrcode-in.html", "localizer/qrcode-out.html", Object.freeze({
                dismissIconDescription: "Close this message",
                qrCodePlaceholder: "QR code placeholder image",
                textareaPlaceholder: "Enter text for QR code here to generate it.",
                optionLearnMore: "Learn more",
                optionErrorCorrectionDescrLink: "https://en.wikipedia.org/wiki/QR_code#Error_correction"
            }), function (stub, localizedValues) {
                // 5 translations -> 5 times called
                sinon.assert.callCount(stub, 5);

                for (const messageName of Object.keys(localizedValues)) {
                    sinon.assert.calledWith(stub, messageName);
                }
            });
        });
    });
});
