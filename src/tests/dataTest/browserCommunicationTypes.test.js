import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import * as BrowserCommunicationTypes from "/common/modules/data/BrowserCommunicationTypes.js";


describe("common data: BrowserCommunicationTypes", function () {
    describe("COMMUNICATION_MESSAGE_TYPE", function () {
        it("is there", function () {
            chai.assert.exists(BrowserCommunicationTypes.COMMUNICATION_MESSAGE_TYPE);
            chai.assert.isNotEmpty(BrowserCommunicationTypes.COMMUNICATION_MESSAGE_TYPE);
        });

        it("is object", function () {
            chai.assert.isObject(BrowserCommunicationTypes.COMMUNICATION_MESSAGE_TYPE);
        });

        it("is frozen", function () {
            chai.assert.isFrozen(BrowserCommunicationTypes.COMMUNICATION_MESSAGE_TYPE);
        });
    });
});