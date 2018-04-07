'use strict';

// Globals
const AddonName = "Offline QR code generator";

var QrCreator = (function () {
    let me = {};

    /**
     * The saved options for Kjua.
     *
     * @name QrCreator.qrCodeOptions
     * @private
     */
    let qrCodeOptions = {
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
        quiet: 0,

        // modes: 'plain', 'label' or 'image'
        mode: 'plain',

        // label/image size and pos in pc: 0..100
        mSize: 30,
        mPosX: 50,
        mPosY: 50
    };

    /**
     * Provide connection to library and get QR code with current options.
     *
     * @name   QrCreator.getQrCodeFromLib
     * @function
     * @private
     * @returns {HTMLElement}
     */
    function getQrCodeFromLib() {
        return kjua(qrCodeOptions);
    }

    /**
     * Displays the QR code when options have been set.
     *
     * @name   QrCreator.generateFromTab
     * @function
     */
    me.generate = function() {
        UserInterface.replaceQr(getQrCodeFromLib());
    };

    /**
     * Sets the text for thq QR code.
     *
     * @name   QrCreator.generateFromTab
     * @function
     * @param  {string} text
     */
    me.setText = function(text) {
        me.setTextInternal(text);
        UserInterface.setQrInputFieldText(text);
    };

    /**
     * Sets the text for the QR code, but does not modify the UI.
     *
     * Usually this should not be used, as it can cause an inconsistent display.
     *
     * @name   QrCreator.generateFromTab
     * @function
     * @param  {string} text
     */
    me.setTextInternal = function(text) {
        qrCodeOptions.text = text;
    };

    /**
     * Generates a QR code from a given tab.
     *
     * @name   QrCreator.generateFromTab
     * @function
     * @param  {browser.tabs} tab
     */
    me.generateFromTab = function(tab) {
        me.setText(tab.url);
        me.generate();
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

var UserInterface = (function () {
    let me = {};

    const qrCode = document.getElementById('qrcode');
    const qrCodePlaceholder = document.getElementById('qrcode-placeholder');
    const qrCodeContainer = document.getElementById('qrcode-container');
    const qrCodeText = document.getElementById('qrcodetext');

    const elError = document.getElementById('error');

    let placeholderShown = true;
    let hideErrorOnUpdate = true;

    /**
     * Hide QR code and show placeholder.
     *
     * @name   UserInterface.refreshQrCode
     * @function
     * @private
     */
    function showPlaceholder() {
        if (placeholderShown == true) {
            // nothing to do
            return;
        }

        qrCode.classList.add("invisible");
        qrCodePlaceholder.classList.remove("invisible");
        placeholderShown = true;
    }

    /**
     * Hide the error.
     *
     * @name   UserInterface.hideError
     * @function
     * @private
     */
    function hideError() {
        hidePlaceholder();
        elError.classList.add("invisible");
    }

    /**
     * Show QR code and hide placeholder.
     *
     * @name   UserInterface.refreshQrCode
     * @function
     * @private
     */
    function hidePlaceholder() {
        if (placeholderShown == false) {
            // nothing to do
            return;
        }

        qrCode.classList.remove("invisible");
        qrCodePlaceholder.classList.add("invisible");
        placeholderShown = false;
    }
    /**
     * Refreshes the QR code, if the text has been changed in the input field.
     *
     * @name   UserInterface.refreshQrCode
     * @function
     * @private
     */
    function refreshQrCode() {
        const text = qrCodeText.value;
        console.log(text, "value");

        // show placeholder when no text is entered
        if (text == "") {
            showPlaceholder();
            return;
        } else if (placeholderShown) {
            hidePlaceholder();
        }

        QrCreator.setTextInternal(text);
        QrCreator.generate();
    }

    /**
     * Show a critical error.
     *
     * @name   UserInterface.showError
     * @function
     * @param  {string} text
     */
    me.showError = function(text) {
        showPlaceholder();
        elError.textContent = text;
    };

    /**
     * Shows the given text in the QR code's input field.
     *
     * @name   UserInterface.setQrText
     * @function
     * @param  {string} text
     */
    me.setQrInputFieldText = function(text) {
        document.getElementById('qrcodetext').textContent = text;
    };

    /**
     * Replace the QR code element with this (new) one.
     *
     * @name   UserInterface.replaceQr
     * @function
     * @param  {HTMLElement} elNewQr
     */
    me.replaceQr = function(elNewQr) {
        if (hideErrorOnUpdate) {
            hideError();
            hideErrorOnUpdate = false;
        }

        // get old element
        const elOldQrCode = qrCode.firstElementChild;
        // and replace it
        qrCode.replaceChild(elNewQr, elOldQrCode);
    };

    /**
     * Initalises the module.
     *
     * @name   UserInterface.init
     * @function
     */
    me.init = function() {
        // add event listeners
        qrCodeText.addEventListener("input", refreshQrCode);
    };

    return me;
})();

var ErrorHandler = (function () {
    let me = {};

    /**
     * Logs an error to console.
     *
     * Pass as many strings/output as you want.
     *
     * @name   ErrorHandler.logError
     * @function
     * @private
     * @param  {string} errortype
     * @param  {...*} args
     */
    function logError() {
        if (arguments.length < 0) {
            console.log(AddonName, "logError has been called without parameters");
            return;
        }

        const args = Array.from(arguments);
        args[0] = AddonName + " [" + args[0] + "]";

        console.log.apply(null, args);
    }

    /**
     * Logs a fatal error.
     *
     * @name   ErrorHandler.logError
     * @function
     * @param  {string} errormessage
     */
    me.logError = function(errormessage) {
        logError("ERROR", errormessage);
    };

    return me;
})();

// init modules
UserInterface.init();

// generate QR code from tab
browser.tabs.query({active: true, currentWindow: true})
            .then(QrCreator.generateFromTabs)
            .catch(ErrorHandler.logError);
