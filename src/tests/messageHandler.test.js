import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import {MESSAGE_LEVEL} from "/common/modules/data/MessageLevel.js";
import * as MessageHandler from "/common/modules/MessageHandler.js";

import * as AddonSettingsStub from "./modules/AddonSettingsStub.js";
import * as HtmlMock from "./modules/HtmlMock.js";

const HTML_BASE_FILE = "./messageHandler/baseCode.html";

describe("common module: MessageHandler", function () {
    before(function () {
        AddonSettingsStub.before();
    });

    beforeEach(function() {
        AddonSettingsStub.stubAllStorageApis();
        return HtmlMock.setTestHtmlFile(HTML_BASE_FILE);
    });

    afterEach(function() {
        AddonSettingsStub.afterTest();
        // HtmlMock.cleanup();
        sinon.restore();
    });

    /**
     * Returns the current state (HTML code) of the currently shown messages.
     *
     * @function
     * @returns {Promise}
     */
    function getHtmlTestCode() {
        return document.querySelector(".message-container");
    }

    /**
     * Resets the HTML code to the given saved version.
     *
     * @function
     * @param {string} newHtml
     * @returns {Promise}
     */
    function setHtmlTestCode(newHtml) {
        const elMessageContainer = document.querySelector(".message-container");
        elMessageContainer.innerHTML = newHtml;
    }

    /**
     * Asserts that no message is currently shown.
     *
     * @function
     * @param {string} message optional failure message
     * @returns {void}
     */
    function assertNoMessageShown(message) {
        let failureMessage = 'A message with classes "{classes}" was shown, although no message was expected. Content: {content}';
        if (message) {
            failureMessage += `, ${message}`;
        }
        const messages = document.getElementsByClassName("message-box");
        for (const messageBox of messages) {
            failureMessage = failureMessage.replace("{classes}", messageBox.classList.toString());
            failureMessage = failureMessage.replace("{content}", messageBox.textContent);
            chai.assert.isTrue(messageBox.classList.contains("invisible"), failureMessage);
        }
    }

    /**
     * Tests that the message function correctly shows the messages.
     *
     * @private
     * @function
     * @param {string} boxId the ID of tghe HtmlElement of the message box
     * @param {string} boxName the name of the tested message box
     * @param {function} functionCall the function under test
     * @returns {Promise}
     */
    function testMessageShow(boxId, boxName, functionCall) {
        it(`shows ${boxName} message`, function () {
            // test function
            MessageHandler.init();
            functionCall();

            const messageBox = document.getElementById(boxId);
            chai.assert.isFalse(
                messageBox.classList.contains("invisible"),
                "The info message box was not shown, although it was expected to be shown."
            );
        });

        it(`shows ${boxName} message with correct text`, function () {
            // test function
            const messageText = "An unique message text 4234523!!";
            MessageHandler.init();
            functionCall(messageText);

            const messageBox = document.getElementById(boxId);
            // verify exitance
            chai.assert.isFalse(
                messageBox.classList.contains("invisible"),
                `The ${boxName} message box was not shown, although it was expected to be shown.`
            );

            // verify content
            chai.assert.strictEqual(messageBox.querySelector(".message-text").textContent, messageText);
        });
    }

    describe("showMessage()", function () {
        it("logs, if called without params", function () {
            const mockConsole = sinon.mock(console);

            mockConsole.expects("error")
                .once().withExactArgs(sinon.match.string, "MessageHandler.showMessage has been called without parameters");

            // test function
            MessageHandler.showMessage();

            mockConsole.verify();

            // and verify, no other stuff is done
            assertNoMessageShown();
        });

        testMessageShow("messageInfo", "info", MessageHandler.showMessage.bind(null, MESSAGE_LEVEL.INFO)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageShow("messageWarning", "warning", MessageHandler.showMessage.bind(null, MESSAGE_LEVEL.WARN)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageShow("messageError", "error", MessageHandler.showMessage.bind(null, MESSAGE_LEVEL.ERROR)); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("showError()", function () {
        testMessageShow("messageError", "error", MessageHandler.showError); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("showWarning()", function () {
        testMessageShow("messageWarning", "warning", MessageHandler.showWarning); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("showInfo()", function () {
        testMessageShow("messageInfo", "info", MessageHandler.showInfo); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("showLoading()", function () {
        testMessageShow("messageLoading", "loading", MessageHandler.showLoading); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("showSuccess()", function () {
        testMessageShow("messageSuccess", "success", MessageHandler.showSuccess); // eslint-disable-line mocha/no-setup-in-describe
    });

    /**
     * Tests that the message function correctly hioes the messages.
     *
     * @private
     * @function
     * @param {string} boxId the ID of tghe HtmlElement of the message box
     * @param {string} boxName the name of the tested message box
     * @param {function} functionCall the function under test
     * @returns {Promise}
     */
    function testMessageHide(boxId, boxName, functionCall) {
        it(`hides ${boxName} message`, function () {
            const messageBox = document.getElementById(boxId);

            // setup requirements
            messageBox.classList.remove("invisible");

            chai.assert.isFalse(
                messageBox.classList.contains("invisible"),
                `Requirements setups: The ${boxName} message box was not shown, although it was expected to be shown.`
            );

            // test function
            MessageHandler.init();
            functionCall();

            // check result
            chai.assert.isTrue(
                messageBox.classList.contains("invisible"),
                `The ${boxName} message box was shown, although it was expected to be hidden.`
            );
        });

        // TODO: throw, if passed no valid message type
    }

    describe("hideMessage()", function () {
        it("hides all messages, if called without params", function () {
            // show all messages
            document.querySelectorAll(".message-box").forEach((messageBox) => {
                messageBox.classList.remove("invisible");
            });

            // test function
            MessageHandler.init();
            MessageHandler.hideMessage();

            // and verify, no message is shown
            assertNoMessageShown();
        });

        testMessageHide("messageInfo", "info", MessageHandler.hideMessage.bind(null, MESSAGE_LEVEL.INFO)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageHide("messageWarning", "warning", MessageHandler.hideMessage.bind(null, MESSAGE_LEVEL.WARN)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageHide("messageError", "error", MessageHandler.hideMessage.bind(null, MESSAGE_LEVEL.ERROR)); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("hideError()", function () {
        testMessageHide("messageError", "error", MessageHandler.hideError); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("hideWarning()", function () {
        testMessageHide("messageWarning", "warning", MessageHandler.hideWarning); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("hideInfo()", function () {
        testMessageHide("messageInfo", "info", MessageHandler.hideInfo); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("hideLoading()", function () {
        testMessageHide("messageLoading", "loading", MessageHandler.hideLoading); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("hideSuccess()", function () {
        testMessageHide("messageSuccess", "success", MessageHandler.hideSuccess); // eslint-disable-line mocha/no-setup-in-describe
    });
});
