import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import {stubSettings} from "./modules/StubHelper.js";

import {MESSAGE_LEVEL} from "/common/modules/MessageLevel.js";
import * as Logger from "/common/modules/Logger.js";

const LOG_PREFIX = Object.freeze({
    INFO: "Offline QR code [INFO]",
    WARN: "Offline QR code [WARN]",
    ERROR: "Offline QR code [ERROR]"
});

describe("common module: Logger", function () {
    beforeEach(function() {
        // reset debug mode to initial value
        Logger.setDebugMode(null);
    });
    afterEach(function() {
        sinon.restore();
    });

    /**
     * Verify the debug mode setting.
     *
     * @private
     * @function
     * @param {function} consoleMock ocalizedValues
     * @returns {Promise}
     */
    function testDebugModeSetting(consoleMock) {
        const logMessage = Symbol("log message");

        const mockConsole = sinon.mock(console);

        consoleMock(mockConsole, logMessage);

        Logger.logInfo(logMessage);

        mockConsole.verify();
    }

    /**
     * Verify the debug mode is enabled.
     *
     * @function
     * @returns {Promise}
     */
    function testDebugModeEnabled() {
        return testDebugModeSetting((mockConsole, logMessage) =>
            mockConsole.expects("log").once().withArgs(LOG_PREFIX.INFO, logMessage)
        );
    }

    /**
     * Verify the debug mode is disabled.
     *
     * @function
     * @returns {Promise}
     */
    function testDebugModeDisabled() {
        return testDebugModeSetting((mockConsole) =>
            // should never call console.log()
            mockConsole.expects("log").never()
        );
    }

    /**
     * Test that the log method is correctly called.
     *
     * @private
     * @function
     * @param {string} prefixName the log method to test
     * @param {function} testFunction the function under test, get's passed the log message
     * @returns {Promise}
     */
    function testLogIsCalled(prefixName, testFunction) {
        let consoleMethod = prefixName.toLowerCase();
        if (consoleMethod === "info") {
            consoleMethod = "log";
        }

        const logMessage = Symbol("log message");
        const mockConsole = sinon.mock(console);

        mockConsole.expects(consoleMethod)
            .once().withArgs(LOG_PREFIX[prefixName], logMessage)

        testFunction(logMessage);

        mockConsole.verify();
    }

    describe("init()", function () {
        it("loads debugMode setting if disabled", async function () {
            stubSettings({
                "debugMode": false
            });

            await Logger.init();

            return testDebugModeDisabled();
        });

        it("loads debugMode setting if enabled", async function () {
            stubSettings({
                "debugMode": true
            });

            await Logger.init();

            return testDebugModeEnabled();
        });
    });

    describe("setDebugMode()", function () {
        it("correctly sets debug mode to enabled", async function () {
            Logger.setDebugMode(true);

            return testDebugModeEnabled();
        });

        it("correctly sets debug mode to disabled", async function () {
            Logger.setDebugMode(false);

            return testDebugModeDisabled();
        });
    });

    describe("log()", function () {
        it("logs, if called without params", async function () {
            const mockConsole = sinon.mock(console);

            mockConsole.expects("error")
                .once().withArgs(LOG_PREFIX.ERROR, "log has been called without parameters")

            // test function
            Logger.log();

            mockConsole.verify();
        });

        it("logs multiple objects", async function () {
            // TODO
        });

        it("correctly JSONifies objects", async function () {
            // TODO
        });

        it("still logs info, if debug mode is not yet loaded", async function () {
            // TODO
            // This assures, that no message is lost or delayed.
        });

        it("uses correct prefix for warning", async function () {
            Logger.setDebugMode(true);

            for (const prefixName of Object.keys(LOG_PREFIX)) {
                testLogIsCalled(prefixName, (logMessage) => {
                    Logger.log(MESSAGE_LEVEL[prefixName], logMessage);
                });
            }
        });

        it("correctly sets debug mode to disabled", async function () {
            Logger.setDebugMode(false);

            return testDebugModeDisabled();
        });
    });

    describe("logInfo()", function () {
        it("calls .log(MESSAGE_LEVEL.INFO)", async function () {
            Logger.setDebugMode(true);

            testLogIsCalled("INFO", (logMessage) => {
                Logger.logInfo(logMessage);
            });
        });
    });

    describe("logWarn()", function () {
        it("calls .log(MESSAGE_LEVEL.WARN)", async function () {
            testLogIsCalled("WARN", (logMessage) => {
                Logger.logWarning(logMessage);
            });
        });
    });

    describe("logError()", function () {
        it("calls .log(MESSAGE_LEVEL.ERROR)", async function () {
            testLogIsCalled("ERROR", (logMessage) => {
                Logger.logError(logMessage);
            });
        });
    });
});
