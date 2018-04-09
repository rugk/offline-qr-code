'use strict';

// Globals
const ADDON_NAME = "Offline QR code generator";
const ADDON_NAME_SHORT = "Offline QR code";

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
        ErrorHandler.logInfo("generated new qr code with text: ", qrCodeOptions.text);
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

    const elBody = document.querySelectorAll('body')[0];
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
        ErrorHandler.logInfo("new value from textarea: ", text);

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
     * Returns whether an (inpout/textare/…) element is selected or not.
     *
     * @name   UserInterface.isSelected
     * @function
     * @private
     * @param {HTMLElement} input
     * @returns {bool}
     */
    function isSelected(input) {
        return input.selectionStart == 0 && input.selectionEnd == input.value.length;
    }

    /**
     * Selects all text of a textarea.
     *
     * @name   UserInterface.selectAllText
     * @function
     * @private
     * @param {Event} event
     */
    function selectAllText(event) {
        const targetIsSelected = document.activeElement == event.target && isSelected(event.target);
        // prevent endless loop after two rechecks (i.e. re-check only two times)
        if (targetIsSelected || event.retry > 2) {
            return;
        }

        ErrorHandler.logInfo("selectAllText", event);

        event.retry = event.retry+1 || 0;

        // re-selecting when already selected, causes flashing, so we avoid that
        if (!targetIsSelected) {
            event.target.focus();
            event.target.select();
        }

        // recheck selection as a workaround for <FF 60 that it really selected
        // it -> recursive retry
        setTimeout(selectAllText, 100, event);
    }

    /**
     * Show a critical error.
     *
     * Note this should only be used to show *short* error messages, which are
     * meaningfull to the user, as the space is limited. So it is mostly only
     * useful to use only one param: a string.
     *
     * @name   UserInterface.showError
     * @function
     * @param  {...*} args
     */
    me.showError = function() {
        const args = Array.from(arguments);

        ErrorHandler.logError("show user error:", args);
        showPlaceholder();

        // localize string or fallback to first string ignoring all others
        elError.textContent = browser.i18n.getMessage.apply(null, args) || args[0] || browser.i18n.getMessage("errorShowingError");
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
        ErrorHandler.logInfo("replace qr code from", elOldQrCode, "to", elNewQr);
        qrCode.replaceChild(elNewQr, elOldQrCode);
    };

    /**
     * Initalises the module.
     *
     * @name   UserInterface.init
     * @function
     */
    me.init = function() {
        ErrorHandler.logInfo("starting…");
        // add event listeners
        qrCodeText.addEventListener("input", refreshQrCode);
        qrCodeText.addEventListener("focus", selectAllText);

        // manually focus (and select) element when starting
        // in brute-force-style as bugs seem to prevent it from working otherwise
        // bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1324255, < FF 60
        setTimeout(selectAllText, 50, { target: qrCodeText });
    };

    return me;
})();

var ErrorHandler = (function () {
    let me = {};

    const debugMode = true;

    /**
     * Logs a string to console.
     *
     * Pass as many strings/output as you want.
     *
     * @name   ErrorHandler.log
     * @function
     * @private
     * @param  {string} errortype
     * @param  {...*} args
     */
    function log() {
        if (arguments.length < 0) {
            // recursive call, it's secure, because this won't fail
            return log("ERROR", "log has been called without parameters");
        }

        const args = Array.from(arguments);
        const errortype = args[0]
        args[0] = ADDON_NAME_SHORT + " [" + errortype + "]";

        switch (errortype) {
            case "ERROR":
                console.error.apply(null, args);
                break;
            case "WARN":
                console.warn.apply(null, args);
                break;
            default:
                console.log.apply(null, args);
        }
    }

    /**
     * Logs a fatal error.
     *
     * @name   ErrorHandler.logError
     * @function
     * @param  {...*} args
     */
    me.logError = function() {
        const args = Array.from(arguments);
        args.unshift("INFO");

        log.apply(null, args);
    };

    /**
     * Logs some information.
     *
     * Note: This log may be skipped, when not in debug mode.
     *
     * @name   ErrorHandler.logInfo
     * @function
     * @param  {...*} args
     */
    me.logInfo = function() {
        if (debugMode === false) {
            return;
        }

        const args = Array.from(arguments);
        args.unshift("INFO");

        log.apply(null, args);
    };

    return me;
})();

var Localizer = (function () {
    let me = {};

    const i18nAttribute = "data-i18n";

    const localizedAttributes = [
        "placeholder",
        "alt"
    ]

    /**
     * Splits the _MSG__*__ format and returns the actual tag.
     *
     * @name   Localizer.getMessageFromTag
     * @function
     * @private
     * @param  {string} tag
     * @returns {string}
     */
    function getMessageTag(tag) {
        const splitMessage = tag.split(/^__MSG_(\w+)__$/);

        // this may throw exceptions, but then the input is just invalid
        return splitMessage[1];
    }

    /**
     * Logs a string to console.
     *
     * Pass as many strings/output as you want.
     *
     * @name   Localizer.replaceI18n
     * @function
     * @private
     * @param  {HTMLElement} elem element to translate
     * @param  {string} tag name of the
     */
    function replaceI18n(elem, tag) {
        // localize main content
        if (tag != "") {
            elem.textContent = browser.i18n.getMessage(getMessageTag(tag));
        }

        // replace attributes
        localizedAttributes.forEach((currentAttribute) => {
            const currentLocaleAttribute = `${i18nAttribute}-${currentAttribute}`;

            if (elem.hasAttribute(currentLocaleAttribute)) {
                const attributeTag = elem.getAttribute(currentLocaleAttribute);
                elem.setAttribute(currentAttribute, browser.i18n.getMessage(getMessageTag(attributeTag)));
            }
        });
    }

    /**
     * Localizes static strings in the HTML file.
     *
     * @name   Localizer.init
     * @function
     */
    me.init = function() {
        document.querySelectorAll(`[${i18nAttribute}]`).forEach((currentElem) => {
            ErrorHandler.logInfo("init translate", currentElem);

            const contentString = currentElem.getAttribute(i18nAttribute);
            replaceI18n(currentElem, contentString);
        });

        // replace html lang attribut after translation
        document.querySelectorAll("html")[0].setAttribute("lang", browser.i18n.getUILanguage());
    };

    return me;
})();

// init modules
UserInterface.init();
Localizer.init();

// generate QR code from tab
browser.tabs.query({active: true, currentWindow: true})
            .then(QrCreator.generateFromTabs)
            .catch(ErrorHandler.logError);
