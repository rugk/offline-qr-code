'use strict';

/* globals Logger */
/* globals AddonSettings */
/* globals MessageHandler */
/* globals ADDON_NAME */
/* globals ADDON_NAME_SHORT */
/* globals MESSAGE_LEVEL */

// abstracts away all specific handling of QR code library
var QrLibKjua = (function () {
    let me = {};

    /* globals kjua */

    /**
     * The saved options for Kjua.
     *
     * @name QrCreator.kjuaOptions
     * @private
     */
    let kjuaOptions;

    /**
     * How options need to be mapped from general options to kjua.
     *
     * format: generalOpt => kjua
     *
     * @name QrCreator.OPTIONS_MAP
     * @private
     */
    const OPTIONS_MAP = Object.freeze({
        "qrColor": "fill",
        "qrBackgroundColor": "back",
        "qrErrorCorrection": "ecLevel"
    });

    /**
     * Resets all options for the QR code.
     *
     * @name   QrLibKjua.reset
     * @function
     * @returns {HTMLElement}
     */
    me.reset = function() {
        kjuaOptions = {
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
    };

    /**
     * Set an option for the QR code.
     *
     * @name   QrLibKjua.set
     * @function
     * @param {string} tag
     * @param {object} value
     */
    me.set = function(tag, value) {
        if (OPTIONS_MAP.hasOwnProperty(tag)) {
            tag = OPTIONS_MAP[tag];
        }

        // TODO: should it reject invalid values?

        kjuaOptions[tag] = value;
    };

    /**
     * Return new QR code.
     *
     * @name   QrLibKjua.getQr
     * @function
     * @returns {HTMLElement}
     */
    me.getQr = function() {
        Logger.logInfo("generated new qr kjua code", kjuaOptions);
        return kjua(kjuaOptions);
    };

    /**
     * Init connector module.
     *
     * @name   QrLibKjua.init
     * @function
     */
    me.init = function() {
        me.reset();
    };

    return me;
})();

var QrCreator = (function () {
    let me = {};

    /**
     * Provide connection to library and get QR code with current options.
     *
     * @name   QrCreator.getQrCodeFromLib
     * @function
     * @private
     * @returns {HTMLElement}
     */
    function getQrCodeFromLib() {
        return QrLibKjua.getQr();
    }

    /**
     * Displays the QR code when options have been set.
     *
     * @name   QrCreator.generate
     * @function
     */
    me.generate = function() {
        UserInterface.replaceQr(getQrCodeFromLib());
    };

    /**
     * Sets the size of the QR code.
     *
     * @name   QrCreator.setSize
     * @function
     * @param  {int} size
     */
    me.setSize = function(size) {
        if (size <= 1) {
            Logger.logError("tried to create QR code with invalid size of 0 or smaller");
            return;
        }

        QrLibKjua.set("size", size);
    };

    /**
     * Sets the text for the QR code.
     *
     * @name   QrCreator.setText
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
        QrLibKjua.set("text", text);
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
     * @name   QrCreator.generateFromTabs
     * @function
     * @param  {browser.tabs} tabs
     */
    me.generateFromTabs = function(tabs) {
        me.generateFromTab(tabs[0]);
    };

    /**
     * Initiates module.
     *
     * @name   QrCreator.init
     * @function
     * @return {Promise}
     */
    me.init = function() {
        // get all settings
        return AddonSettings.get().then((settings) => {
            // @TODO pass object?
            // @TODO iterate over all available options? (beginning with qr?)
            QrLibKjua.set("qrColor", settings.qrColor);
            QrLibKjua.set("qrBackgroundColor", settings.qrBackgroundColor);
            QrLibKjua.set("qrErrorCorrection", settings.qrErrorCorrection);
        });
    };

    return me;
})();

var UserInterface = (function () {
    let me = {};

    const TOP_SCROLL_TIMEOUT = 10; //ms
    const SELECT_TEXT_TIMEOUT = 100; //ms
    const QR_CODE_REFRESH_TIMEOUT = 200; //ms
    const QR_CODE_CONTAINER_MARGIN = 40; //px
    const QR_CODE_SIZE_SNAP = 5; //px
    const QR_CODE_SIZE_DECREASE_SNAP = 2 //px
    const WINDOW_MINIMUM_HEIGHT = 250 //px

    const elBody = document.querySelectorAll('body')[0];
    const qrCode = document.getElementById('qrcode');
    const qrCodePlaceholder = document.getElementById('qrcode-placeholder');
    const qrCodeContainer = document.getElementById('qrcode-container');
    const qrCodeResizeContainer = document.getElementById('qrcode-resize-container');
    const qrCodeText = document.getElementById('qrcodetext');

    let placeholderShown = true;
    let hideLoadingOnUpdate = true; // hides loading message
    let qrCodeRefreshTimer = null;

    // default/last size
    let qrLastSize = 200;
    let qrLockSize = true;

    /**
     * Hide QR code and show placeholder instead.
     *
     * @name   UserInterface.showPlaceholder
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
        // break normally again, as "normal" text is shown
        qrCodeText.style.wordBreak = "unset";
        placeholderShown = true;
    }

    /**
     * Show QR code and hide placeholder.
     *
     * @name   UserInterface.hidePlaceholder
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
        qrCodeText.style.wordBreak = "";
        placeholderShown = false;
    }

    /**
     * Refreshes the QR code, if the text has been changed in the input field.
     *
     * @name   UserInterface.refreshQrCode
     * @function
     * @private
     * @param {event} event
     */
    function refreshQrCode(event) {
        // if a timer is already running and the current call does not finish it
        if (qrCodeRefreshTimer !== null && !event.hasOwnProperty("isTimer")) {
            // do nothing, as this is an additional call during the
            // timeout, which we want to omit/
            return;
        } else if (qrCodeRefreshTimer === null) {
            // if the timer has not been started yet, start it
            event.isTimer = true;
            qrCodeRefreshTimer = setTimeout(refreshQrCode, QR_CODE_REFRESH_TIMEOUT, event);
            return;
        }

        // if timer has been reached, reset timer
        qrCodeRefreshTimer = null;

        const text = qrCodeText.value;
        Logger.logInfo("new value from textarea: ", text);

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

        Logger.logInfo("selectAllText", event);

        event.retry = event.retry+1 || 0;

        // re-selecting when already selected, causes flashing, so we avoid that
        if (!targetIsSelected) {
            event.target.focus();
            event.target.select();

            // but set scroll position to top one, because you want to see the
            // top of the URL ;)
            // (selecting makes the scroll position go to the bottom)
            setTimeout(scrollToTop, TOP_SCROLL_TIMEOUT, event);
        }

        // recheck selection as a workaround for <FF 60 that it really selected
        // it -> recursive retry
        setTimeout(selectAllText, SELECT_TEXT_TIMEOUT, event);
    }

    /**
     * Scrolls to the top of the element.
     *
     * @name   UserInterface.scrollToTop
     * @function
     * @private
     * @param {Event} event
     */
    function scrollToTop(event) {
        Logger.logInfo("scrollToTop", event);

        if (event.target.scrollTop != 0) {
            event.target.scrollTop = 0;
        }

        // only retry once, if needed
        if (event.setScrolled) {
            return;
        }

        // Attention: make sure this does not collide with the rety-property set
        // in selectAllText()!
        event.setScrolled = true;

        // recheck selection as a workaround for <FF 60 that it really selected
        // it -> recursive retry
        setTimeout(selectAllText, TOP_SCROLL_TIMEOUT, event);
    }

    /**
     * Sets the new size of the container for the QR code.
     *
     * @name   UserInterface.setQrCodeResizeContainerSize
     * @function
     * @private
     * @param {int} newSize the new size in px
     */
    function setQrCodeResizeContainerSize(newSize) {
        qrCodeResizeContainer.style.width = `${newSize}px`;
        qrCodeResizeContainer.style.height = `${newSize}px`;
    }

    /**
     * Resize the UI elements when the popup, etc. is resized.
     *
     * @name   UserInterface.resizeElements
     * @function
     * @private
     * @param {Array|Event} event
     */
    function resizeElements(event) {
        const newQrCodeSize = Math.min(qrCodeContainer.offsetHeight, qrCodeContainer.offsetWidth) - QR_CODE_CONTAINER_MARGIN;
        const qrSizeDiff = newQrCodeSize - qrLastSize;

        // rezizing at small window heights (e.g. when popup is being constructed)
        // could cause it to be resized to 0px or so
        const windowHeight = window.innerHeight;
        if (windowHeight < WINDOW_MINIMUM_HEIGHT) {
            Logger.logInfo("Skipped resize due to low window height", windowHeight);
            return;
        }

        // do not resize if size is not *increased* by 5 px or *decreased* by 2px
        if (qrSizeDiff < QR_CODE_SIZE_SNAP && qrSizeDiff > -QR_CODE_SIZE_DECREASE_SNAP) {
            return;
        }

        Logger.logInfo("resize QR code from ", qrLastSize, " to ", newQrCodeSize);

        // apply new size
        QrCreator.setSize(newQrCodeSize);

        setQrCodeResizeContainerSize(newQrCodeSize);

        qrLastSize = newQrCodeSize;

        // do not regenerate QR code if an error or so is shown
        if (placeholderShown === false) {
            qrLockSize = false;
            QrCreator.generate();
            qrLockSize = true;
        }
    }

    /**
     * Shows the given text in the QR code's input field.
     *
     * @name   UserInterface.setQrText
     * @function
     * @param  {string} text
     */
    me.setQrInputFieldText = function(text) {
        qrCodeText.textContent = text;
    };

    /**
     * Replace the QR code element with this (new) one.
     *
     * @name   UserInterface.replaceQr
     * @function
     * @param  {HTMLElement} elNewQr
     */
    me.replaceQr = function(elNewQr) {
        // only hide startup loading message
        if (hideLoadingOnUpdate) {
            document.getElementById("messageLoading").classList.add("invisible");
            hideLoadingOnUpdate = false;
        }

        // get old element
        const elOldQrCode = qrCode.firstElementChild;
        const oldSize = elOldQrCode.getAttribute("width");

        // prevent accidential resizes when text of QR code changes, e.g.
        if (qrLockSize && oldSize != elNewQr.getAttribute("width")) {
            Logger.logWarning("qr code size is locked, but has been tried to be modify:", elOldQrCode, "to", elNewQr);
        }

        // and replace it
        Logger.logInfo("replace qr code from", elOldQrCode, "to", elNewQr);
        qrCode.replaceChild(elNewQr, elOldQrCode);
    };

    /**
     * Initalises the module.
     *
     * @name   UserInterface.init
     * @function
     * @return {Promise}
     */
    me.init = function() {
        // set error hooks
        MessageHandler.setHook(MESSAGE_LEVEL.ERROR, showPlaceholder, hidePlaceholder);

        // add event listeners
        qrCodeText.addEventListener("input", refreshQrCode);
        qrCodeText.addEventListener("focus", selectAllText);

        // listen for resizes at the textarea
        new MutationObserver(resizeElements).observe(qrCodeText, {
            attributes: true,
            attributeFilter: ["style"]
        });

        // and manually set right size
        setQrCodeResizeContainerSize(qrLastSize);

        // manually focus (and select) element when starting
        // in brute-force-style as bugs seem to prevent it from working otherwise
        // bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1324255, < FF 60
        setTimeout(selectAllText, 50, { target: qrCodeText });

        AddonSettings.get("monospaceFont").then((res) => {
            if (res.monospaceFont) {
                qrCodeText.style.fontFamily = "monospace";
            }
        });
        AddonSettings.get("qrBackgroundColor").then((res) => {
            if (res.qrBackgroundColor) {
                qrCodeContainer.style.backgroundColor = res.qrBackgroundColor;
            }
        });
    };

    return me;
})();

// init modules
QrLibKjua.init();
var qrCreatorInit = QrCreator.init();
UserInterface.init();

// generate QR code from tab, if everything is set up
qrCreatorInit.then((res) => {
    browser.tabs.query({active: true, currentWindow: true})
                .then(QrCreator.generateFromTabs).catch((error) => {
                    Logger.logError(error);
                    MessageHandler.showError("couldNotReceiveActiveTab");
                });
}).catch(Logger.logError);
