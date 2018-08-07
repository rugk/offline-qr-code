import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */
import "https://unpkg.com/sinon@6.1.4/pkg/sinon.js"; /* globals sinon */

function createDocElement(elemName) {
    const node = document.createElement(elemName);
    const div = document.createElement("div");
}

import * as Localiser from "/common/modules/Localiser.js";
describe("common module: Localiser", function () {
    describe("init()", function () {
        // TODO: https://github.com/darrylwest/mock-browser https://stackoverflow.com/questions/36500723/how-to-mock-window-document-with-mocha-chai ?
        it("splits '__MSG_extensionNameShort__'", function () {


            const node = {
                getAttribute: sinon.stub().withArgs("data-i18n").returns("__MSG_extensionNameShort__"),
                setAttribute: sinon.stub()
            };

            sinon.replace(document, "querySelectorAll",
                sinon.stub().withArgs("[data-i18n]").returns([node])
            );

            sinon.assert.calledWith(node.setAttribute, )
        });
    });
});
