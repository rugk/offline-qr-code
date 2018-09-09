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
        return document.querySelector(".message-container").innerHTML;
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

        it("throws, if called with invalid message type", function () {
            MessageHandler.init();

            // test function -> pass 777 as message type
            chai.assert.throws(MessageHandler.showMessage.bind(null, 777), Error);

            // and verify, no message is shown
            assertNoMessageShown();
        });

        testMessageShow("messageInfo", "info", MessageHandler.showMessage.bind(null, MESSAGE_LEVEL.INFO)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageShow("messageWarning", "warning", MessageHandler.showMessage.bind(null, MESSAGE_LEVEL.WARN)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageShow("messageError", "error", MessageHandler.showMessage.bind(null, MESSAGE_LEVEL.ERROR)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageShow("messageSuccess", "success", MessageHandler.showMessage.bind(null, MESSAGE_LEVEL.SUCCESS)); // eslint-disable-line mocha/no-setup-in-describe
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
     * @param {string} boxId the ID of the HtmlElement of the message box
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

        it("throws, if called with invalid message type", function () {
            MessageHandler.init();

            // test function -> pass 777 as message type
            chai.assert.throws(MessageHandler.hideMessage.bind(null, 777), Error);

            // and verify, no message is shown
            assertNoMessageShown();
        });

        testMessageHide("messageInfo", "info", MessageHandler.hideMessage.bind(null, MESSAGE_LEVEL.INFO)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageHide("messageWarning", "warning", MessageHandler.hideMessage.bind(null, MESSAGE_LEVEL.WARN)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageHide("messageError", "error", MessageHandler.hideMessage.bind(null, MESSAGE_LEVEL.ERROR)); // eslint-disable-line mocha/no-setup-in-describe
        testMessageHide("messageSuccess", "success", MessageHandler.hideMessage.bind(null, MESSAGE_LEVEL.SUCCESS)); // eslint-disable-line mocha/no-setup-in-describe
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

    describe("setMessageDesign()", function () {
        /**
         * Tests that the message function correctly hioes the messages.
         *
         * @private
         * @function
         * @param {string} boxId the ID of the HtmlElement of the message box
         * @param {MESSAGE_LEVEL} messageLevel the message level design to add
         * @param {string} oldClass the old class of the function
         * @param {string} newClass the fnew class of the function
         * @returns {Promise}
         */
        function testMessageDesign(boxId, messageLevel, oldClass, newClass) {
            const elMessage = document.getElementById(boxId);

            MessageHandler.setMessageDesign(elMessage, messageLevel);

            // verify classes are set
            chai.assert.isFalse(
                elMessage.classList.contains(oldClass),
                `Testing with box ${boxId}. Message type was not removed. ${oldClass} class is still there.`
            );
            chai.assert.isTrue(
                elMessage.classList.contains(newClass),
                `Testing with box ${boxId}. Message type was not added. It was expected to be set to ${newClass}.`
            );

            // verify classes of action button
            const elMessageActionButton = elMessage.querySelector(".message-action-button");

            chai.assert.isFalse(
                elMessageActionButton.classList.contains(oldClass),
                `Testing with action button of box ${boxId}. Message type was not removed. ${oldClass} class is still there.`
            );
            chai.assert.isTrue(
                elMessageActionButton.classList.contains(newClass),
                `Testing with action button of box ${boxId}. Message type was not added. It was expected to be set to ${newClass}.`
            );
        }

        it("changes design", function () {
            const testCode = getHtmlTestCode();

            testMessageDesign("messageSuccess", MESSAGE_LEVEL.INFO, "success", "info");
            // reset test code
            setHtmlTestCode(testCode);

            testMessageDesign("messageSuccess", MESSAGE_LEVEL.WARN, "success", "warning");
            // reset test code
            setHtmlTestCode(testCode);

            testMessageDesign("messageSuccess", MESSAGE_LEVEL.ERROR, "success", "error");
            // reset test code
            setHtmlTestCode(testCode);

            testMessageDesign("messageError", MESSAGE_LEVEL.SUCCESS, "error", "success");
            // reset test code
            setHtmlTestCode(testCode);

            testMessageDesign("messageError", MESSAGE_LEVEL.LOADING, "error", "info");
            // reset test code
            setHtmlTestCode(testCode);
        });
    });

    describe("cloneMessage()", function () {
        /**
         * Tests that the message function correctly hioes the messages.
         *
         * @private
         * @function
         * @param {string} boxId the ID of the HtmlElement of the message box
         * @param {MESSAGE_LEVEL|HTMLElement} passToFunction the message level or element to pass to the function
         * @param {MESSAGE_LEVEL} expectedClass the message level design to add
         * @returns {Promise}
         */
        function testMessageDesign(boxId, passToFunction, expectedClass) {
            const newId = `veryUniqueStringMessageId${Math.random()}`;

            const newMessage = MessageHandler.cloneMessage(passToFunction, newId);

            // verify classes are set
            chai.assert.isTrue(
                newMessage.classList.contains(expectedClass),
                `Testing with box ${boxId}. Does not have class "${expectedClass}".`
            );

            // verify it has ID
            chai.assert.strictEqual(
                newMessage.id,
                newId,
                `Testing with box ${boxId}. Has wrong ID.`
            );
        }

        it("clones existing message by type", function () {
            MessageHandler.init();

            testMessageDesign("messageLoading", MESSAGE_LEVEL.LOADING, "info");
            testMessageDesign("messageInfo", MESSAGE_LEVEL.INFO, "info");
            testMessageDesign("messageSuccess", MESSAGE_LEVEL.SUCCESS, "success");
            testMessageDesign("messageWarning", MESSAGE_LEVEL.WARN, "warning");
            testMessageDesign("messageError", MESSAGE_LEVEL.ERROR, "error");
        });

        it("clones HTMLElement", function () {
            testMessageDesign("messageInfo", document.getElementById("messageInfo"), "info");
            testMessageDesign("messageError", document.getElementById("messageError"), "error");
        });
    });
});
