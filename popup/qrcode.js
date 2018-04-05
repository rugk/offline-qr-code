'use strict';

// Globals
const AddonName = "Offline QR code generator";

var QrCreator = (function () {
    let me = {};

    /**
     * Generates a QR code from a given tab.
     *
     *
     *
     * @name   QrCreator.generateFromTab
     * @
     */
    let kjuaOptions = {
        // render method: 'canvas' or 'image'
        render: 'canvas',

        // render pixel-perfect lines
        crisp: true,

        // minimum version: 1..40
        minVersion: 1,

        // error correction level: 'L', 'M', 'Q' or 'H'
        ecLevel: 'H',

        // size in pixel
        size: 200,

        // pixel-ratio, null for devicePixelRatio
        ratio: null,

        // code color
        fill: '#0c0c0d',

        // background color
        back: '#ffffff',

        // roundend corners in pc: 0..100
        rounded: 0,

        // quiet zone in modules
        quiet: 1,

        // modes: 'plain', 'label' or 'image'
        mode: 'plain',

        // label/image size and pos in pc: 0..100
        mSize: 30,
        mPosX: 50,
        mPosY: 50
    };

    /**
     * Show a QR code with the following string.
     *
     * @name   QrCreator.generateFromTab
     * @function
     * @param  {string} text
     */
    me.generate = function(text) {
        kjuaOptions.text = text;

        const qrcode = kjua(kjuaOptions);
        document.querySelector('body').appendChild(qrcode);
    };

    /**
     * Generates a QR code from a given tab.
     *
     * @name   QrCreator.generateFromTab
     * @function
     * @param  {browser.tabs} tab
     */
    me.generateFromTab = function(tab) {
        me.generate(tab.url);
    };

    /**
     * Generates a QR code for multiple tabs.
     *
     * Attention: Currently just uses the first tab, only!
     *
     * @name   QrCreator.generateFromTab
     * @function
     * @param  {browser.tabs} tabs
     */
    me.generateFromTabs = function(tabs) {
        me.generateFromTab(tabs[0]);
    };

    return me;
})();

var ErrorHandler = (function () {
    let me = {};

    /**
     * Logs an error, when a promise is rejected.
     *
     * @name   ErrorHandler.handleRejectedPromise
     * @function
     * @param  {string} errormessage
     */
    me.handleRejectedPromise = function(errormessage) {
        console.log(AddonName + " had unhandled promise: ", errormessage);
    };

    return me;
})();

browser.tabs.query({active: true, currentWindow: true})
            .then(QrCreator.generateFromTabs)
            .catch(ErrorHandler.handleRejectedPromise);
