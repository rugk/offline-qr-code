import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.5/pkg/sinon.js"; /* globals sinon */

import * as AddonSettingsStub from "./modules/AddonSettingsStub.js";

import {MESSAGE_LEVEL} from "/common/modules/data/MessageLevel.js";
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
        return testDebugModeSetting((mockConsole, logMessage) => mockConsole.expects("log").once().withExactArgs(LOG_PREFIX.INFO, logMessage));
    }

    /**
     * Verify the debug mode is disabled.
     *
     * @function
     * @returns {Promise}
     */
    function testDebugModeDisabled() {
        // should never call console.log()
        return testDebugModeSetting((mockConsole) => mockConsole.expects("log").never());
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
            .once().withExactArgs(LOG_PREFIX[prefixName], logMessage);

        testFunction(logMessage);

        mockConsole.verify();
    }

    describe("init()", function () {
        before(function () {
            AddonSettingsStub.before();
        });

        beforeEach(function() {
            AddonSettingsStub.stubAllStorageApis();
        });

        afterEach(function() {
            sinon.restore();
            AddonSettingsStub.afterTest();
        });

        it("loads debugMode setting if disabled", async function () {
            AddonSettingsStub.stubSettings({
                "debugMode": false
            });

            await Logger.init();

            return testDebugModeDisabled();
        });

        it("loads debugMode setting if enabled", async function () {
            AddonSettingsStub.stubSettings({
                "debugMode": true
            });

            await Logger.init();

            return testDebugModeEnabled();
        });
    });

    describe("setDebugMode()", function () {
        it("correctly sets debug mode to enabled", function () {
            Logger.setDebugMode(true);

            return testDebugModeEnabled();
        });

        it("correctly sets debug mode to disabled", function () {
            Logger.setDebugMode(false);

            return testDebugModeDisabled();
        });
    });

    /**
     * Tests that the passed log function behaves correctly cwhen logging options.
     *
     * The function is always called with the parameters to log, only. So when
     * you test .log(), you need to .bind it.
     *
     * @private
     * @function
     * @param {string} logMethod the console.<??> method tzhat is expected to
     *                           be called
     * @param {function} logFunctionCall the log function to test
     * @returns {Promise}
     */
    function testlogObject(logMethod, logFunctionCall) {
        it("logs multiple objects", function () {
            const param1 = Symbol("start log message");
            const param2 = "a great string";
            const param3 = {
                and: "an object, because we like",
                integers: 123
            };

            const mockConsole = sinon.mock(console);

            mockConsole.expects(logMethod)
                .once().withExactArgs(sinon.match.any, param1, param2, param3);

            // test function
            logFunctionCall(param1, param2, param3);

            mockConsole.verify();
        });

        it("correctly freezes objects", function () {
            const logMessageExpected = {
                and: "an object, because we like",
                integers: 123
            };

            const spyLog = sinon.spy(console, logMethod);

            // copy object (we do not test with nested objects here, so Object.assign doing a shallow copy is fine)
            const logMessageModify = Object.assign({}, logMessageExpected);

            logFunctionCall(logMessageModify);

            // modify object
            logMessageModify.and = "modify object";
            logMessageModify.integers = 234;

            // now verify passed argument manually
            chai.assert.deepEqual(
                spyLog.args[0][1], // verify second argument of first call
                logMessageExpected // it should ignore the modifications done to the object
                , "did not ignore changed object properties/freeze object");
        });
    }

    describe("log()", function () {
        it("logs, if called without params", function () {
            const mockConsole = sinon.mock(console);

            mockConsole.expects("error")
                .once().withExactArgs(LOG_PREFIX.ERROR, "log has been called without parameters");

            // test function
            Logger.log();

            mockConsole.verify();
        });

        testlogObject("log", Logger.log.bind(null, MESSAGE_LEVEL.INFO)); // eslint-disable-line mocha/no-setup-in-describe

        it("still logs info, if debug mode is not yet loaded", function () {
            Logger.setDebugMode(true);

            // note it is not explicitly enabled, but internally set to "null"
            return testDebugModeEnabled();
        });

        it("uses correct prefix for different error levels", function () {
            Logger.setDebugMode(true);

            for (const prefixName of Object.keys(LOG_PREFIX)) {
                testLogIsCalled(prefixName, (logMessage) => {
                    Logger.log(MESSAGE_LEVEL[prefixName], logMessage);
                });
            }
        });
    });

    describe("logInfo()", function () {
        it("calls .log(MESSAGE_LEVEL.INFO)", function () {
            Logger.setDebugMode(true);

            testLogIsCalled("INFO", (logMessage) => {
                Logger.logInfo(logMessage);
            });
        });

        testlogObject("log", Logger.logInfo); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("logWarn()", function () {
        it("calls .log(MESSAGE_LEVEL.WARN)", function () {
            testLogIsCalled("WARN", (logMessage) => {
                Logger.logWarning(logMessage);
            });
        });

        testlogObject("warn", Logger.logWarning); // eslint-disable-line mocha/no-setup-in-describe
    });

    describe("logError()", function () {
        it("calls .log(MESSAGE_LEVEL.ERROR)", function () {
            testLogIsCalled("ERROR", (logMessage) => {
                Logger.logError(logMessage);
            });
        });

        testlogObject("error", Logger.logError); // eslint-disable-line mocha/no-setup-in-describe
    });
});
