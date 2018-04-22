"use strict";

/* globals Logger */
/* globals AddonSettings */
/* globals MessageHandler */
/* globals MESSAGE_LEVEL */
// lodash
/* globals throttle, isObject */

// abstracts away all specific handling of QR code library
const QrLibKjua = (function () {
    const me = {};

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
            render: "canvas",

            // render pixel-perfect lines
            crisp: true,

            // minimum version: 1..40
            minVersion: 1,

            // error correction level: 'L', 'M', 'Q' or 'H'
            ecLevel: "H",

            // size in pixel
            size: 200,

            // pixel-ratio, null for devicePixelRatio
            ratio: null,

            // code color
            fill: "#0c0c0d",

            // background color
            back: "#ffffff",

            // roundend corners in pc: 0..100
            rounded: 0,

            // quiet zone in modules
            quiet: 0,

            // modes: 'plain', 'label' or 'image'
            mode: "plain",

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
     * @param {string} tag the common one you know from the outside, e.g. size
     * @param {Object} value the value to set for this tag
     * @returns {void}
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
     * @returns {void}
     */
    me.init = function() {
        me.reset();
    };

    return me;
})();

const QrCreator = (function () {
    const me = {};

    let initFinished = false;

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
     * @returns {void}
     */
    me.generate = function() {
        if (!initFinished) {
            Logger.logWarning("QrCreator.generate called, but init not yet finished. Abort.");
            return;
        }

        UserInterface.replaceQr(getQrCodeFromLib());
    };

    /**
     * Sets the size of the QR code.
     *
     * @name   QrCreator.setSize
     * @function
     * @param  {int} size
     * @returns {void}
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
     * @returns {void}
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
     * @returns {void}
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
     * @returns {void}
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
     * @param  {browser.tabs} tabs tabs passed from browser.tabs
     * @returns {void}
     */
    me.generateFromTabs = function(tabs) {
        me.generateFromTab(tabs[0]);

        // hide loading message shown by default
        MessageHandler.hideLoading();
    };

    /**
     * Initiates module.
     *
     * @name   QrCreator.init
     * @function
     * @returns {Promise}
     */
    me.init = function() {
        // get all settings
        return AddonSettings.get().then((settings) => {
            QrLibKjua.set("qrColor", settings.qrColor);
            QrLibKjua.set("qrBackgroundColor", settings.qrBackgroundColor);
            QrLibKjua.set("qrErrorCorrection", settings.qrErrorCorrection);

            initFinished = true;
        });
    };

    return me;
})();

const UserInterface = (function () {
    const me = {};

    const TOP_SCROLL_TIMEOUT = 10; // ms
    const SELECT_TEXT_TIMEOUT = 100; // ms
    const QR_CODE_REFRESH_TIMEOUT = 200; // ms
    const QR_CODE_CONTAINER_MARGIN = 40; // px
    const QR_CODE_SIZE_SNAP = 5; // px
    const QR_CODE_SIZE_DECREASE_SNAP = 2; // px
    const WINDOW_MINIMUM_HEIGHT = 250; // px
    const THROTTLE_SIZE_SAVING_FOR_REMEMBER = 500; // ms
    const TIMEOUT_HEIGHT_SCROLLBAR_RESTRICT = 100; // ms

    const elHtml = document.querySelector("html");
    const elBody = document.querySelector("body");
    const qrCode = document.getElementById("qrcode");
    const qrCodePlaceholder = document.getElementById("qrcode-placeholder");
    const qrCodeContainer = document.getElementById("qrcode-container");
    const qrCodeResizeContainer = document.getElementById("qrcode-resize-container");
    const qrCodeText = document.getElementById("qrcodetext");

    let placeholderShown = true;
    let qrCodeRefreshTimer = null;

    // default/last size
    let qrLastSize = 200;
    let qrCodeSizeOption = {};

    /**
     * Hide QR code and show placeholder instead.
     *
     * @name   UserInterface.showPlaceholder
     * @function
     * @private
     * @returns {void}
     */
    function showPlaceholder() {
        if (placeholderShown === true) {
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
     * @returns {void}
     */
    function hidePlaceholder() {
        if (placeholderShown === false) {
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
     * @returns {void}
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
        if (text === "") {
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
     * @param {HTMLElement} input the input element this is about
     * @returns {bool}
     */
    function isSelected(input) {
        return input.selectionStart === 0 && input.selectionEnd === input.value.length;
    }

    /**
     * Selects all text of a textarea.
     *
     * @name   UserInterface.selectAllText
     * @function
     * @private
     * @param {Event} event
     * @returns {void}
     */
    function selectAllText(event) {
        const targetIsSelected = document.activeElement === event.target && isSelected(event.target);
        // prevent endless loop after two rechecks (i.e. re-check only three times)
        if (targetIsSelected || event.retry > 3) {
            return;
        }

        Logger.logInfo("selectAllText", event);

        event.retry = event.retry + 1 || 0;

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
     * @returns {void}
     */
    function scrollToTop(event) {
        Logger.logInfo("scrollToTop", event);

        if (event.target.scrollTop !== 0) {
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
     * Saves the qr code size as an option.
     *
     * @name   UserInterface.saveQrCodeSizeOption
     * @function
     * @private
     * @returns {Promise}
     */
    function saveQrCodeSizeOption() {
        Logger.logInfo("saved qr code text size/style", JSON.parse(JSON.stringify(qrCodeSizeOption)));

        return browser.storage.sync.set({
            "qrCodeSize": qrCodeSizeOption
        });
    }

    /**
     * Executes saveQrCodeTextSize, but only one time each second.
     *
     * This depends on the thottle function from lodash.
     *
     * @name   UserInterface.throttledSaveQrCodeSizeOption
     * @function
     * @private
     */
    const throttledSaveQrCodeSizeOption = throttle(saveQrCodeSizeOption, THROTTLE_SIZE_SAVING_FOR_REMEMBER);

    /**
     * Sets the new size of the QR code.
     *
     * @name   UserInterface.setNewQrCodeSize
     * @function
     * @private
     * @param {int} newSize the new size in px
     * @param {bool} regenerateQr whether the QR code should be regenerated (default: false)
     * @returns {void}
     */
    function setNewQrCodeSize(newSize, regenerateQr) {
        // apply new size
        QrCreator.setSize(newSize);

        qrCodeResizeContainer.style.width = `${newSize}px`;
        qrCodeResizeContainer.style.height = `${newSize}px`;

        if (regenerateQr) {
            QrCreator.generate();
        }

        qrLastSize = newSize;

        // also save new QR code size if needed
        if (qrCodeSizeOption.sizeType === "remember") {
            qrCodeSizeOption.size = qrLastSize;

            // only save QR code size with text size, together
            throttledSaveQrCodeSizeOption();
        }
    }

    /**
     * Saves the current size of the input field. (if setting is set to "remember")
     *
     * @name   UserInterface.saveQrCodeTextSize
     * @function
     * @private
     * @returns {Promise} to go on
     */
    function saveQrCodeTextSize() {
        // if setting is disabled, ignore and always return a successful promise
        if (qrCodeSizeOption.sizeType !== "remember") {
            return new Promise((resolve) => {
                resolve();
            });
        }

        if (!isObject(qrCodeSizeOption.sizeText)) {
            qrCodeSizeOption.sizeText = {};
        }

        // ATTENTION: sizeText styles are saved as CSS string
        qrCodeSizeOption.sizeText.height = qrCodeText.style.height;
        qrCodeSizeOption.sizeText.width = qrCodeText.style.width;

        return throttledSaveQrCodeSizeOption();
    }

    /**
     * Resize the UI elements when the popup, etc. is resized.
     *
     * @name   UserInterface.resizeElements
     * @function
     * @private
     * @returns {void}
     */
    function resizeElements() {
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
            // but allow resize of input text, if needed
            saveQrCodeTextSize();

            return;
        }

        Logger.logInfo("resize QR code from ", qrLastSize, " to ", newQrCodeSize);

        // do not regenerate QR code if an error or so is shown
        setNewQrCodeSize(newQrCodeSize, !placeholderShown);
    }

    /**
     * Shows the given text in the QR code's input field.
     *
     * @name   UserInterface.setQrInputFieldText
     * @function
     * @param  {string} text
     * @returns {void}
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
     * @returns {void}
     */
    me.replaceQr = function(elNewQr) {
        // get old element
        const elOldQrCode = qrCode.firstElementChild;

        // and replace it
        Logger.logInfo("replace qr code from", elOldQrCode, "to", elNewQr);
        qrCode.replaceChild(elNewQr, elOldQrCode);
    };

    /**
     * Initalises the module.
     *
     * @name   UserInterface.init
     * @function
     * @returns {Promise}
     */
    me.init = function() {
        // set error hooks
        MessageHandler.setHook(MESSAGE_LEVEL.LOADING, showPlaceholder, hidePlaceholder);
        MessageHandler.setHook(MESSAGE_LEVEL.ERROR, showPlaceholder, hidePlaceholder);

        // add event listeners
        qrCodeText.addEventListener("input", refreshQrCode);
        qrCodeText.addEventListener("focus", selectAllText);

        AddonSettings.get("monospaceFont").then((monospaceFont) => {
            if (monospaceFont) {
                qrCodeText.style.fontFamily = "monospace";
            }
        });

        const gettingQrColor = AddonSettings.get("qrBackgroundColor");
        gettingQrColor.then((qrBackgroundColor) => {
            if (qrBackgroundColor) {
                qrCodeContainer.style.backgroundColor = qrBackgroundColor;
            }
        });

        const gettingQrSize = AddonSettings.get("qrCodeSize");
        gettingQrSize.then((qrCodeSize) => {
            // save as module variable
            qrCodeSizeOption = qrCodeSize;


            if (qrCodeSize.sizeType === "auto") {
                resizeElements();
            }

            if (qrCodeSize.sizeType === "remember" || qrCodeSize.sizeType === "fixed") {
                if (qrLastSize === qrCodeSize.size) {
                    Logger.logInfo("QR code last size is the same as current setting, so do not reset");
                    // BUT set CSS stuff to make it consistent
                    setNewQrCodeSize(qrCodeSize.size, false);
                } else {
                    // regenerate QR code
                    setNewQrCodeSize(qrCodeSize.size, true);
                }
            }

            // also set height of text (also to prevent display errors) when remember is enabled
            if (qrCodeSize.sizeType === "remember" && qrCodeSize.hasOwnProperty("sizeText")) {
                Logger.logInfo("restore qr code text size:", qrCodeSize.sizeText);
                // is saved as CSS string already
                qrCodeText.style.height = qrCodeSize.sizeText.height;
                qrCodeText.style.width = qrCodeSize.sizeText.width;

                // detect too small size
                const minimalSize = qrCodeSize.size + parseInt(qrCodeSize.sizeText.height, 10);
                if (window.innerHeight < minimalSize) {
                    Logger.logError("too small size", window.innerHeight, "shpould be at least: ", minimalSize);
                }
            }

            // in any case, apply height restriction only after the size has been set
            // this prevents overflow/display issues.
            setTimeout(() => {
                elHtml.classList.add("preventScrollbar");
                elBody.classList.add("preventScrollbar");
            }, TIMEOUT_HEIGHT_SCROLLBAR_RESTRICT);
        });

        // for some very strange reason, initing it as fast as possible gives better performance when resizing later
        const mutationObserver = new MutationObserver(resizeElements);
        // start listening for resize events when size is set or when setting has errors or so
        const startResize = () => {
            // listen for resizes at the textarea
            mutationObserver.observe(qrCodeText, {
                attributes: true,
                attributeFilter: ["style"]
            });
        };
        gettingQrSize.then(startResize).catch(startResize);

        // manually focus (and select) element when starting
        // in brute-force-style as bugs seem to prevent it from working otherwise
        // bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1324255, < FF 60
        setTimeout(selectAllText, 50, { target: qrCodeText });

        return gettingQrSize.then(() => {
            return gettingQrColor;
        });
    };

    return me;
})();

// init modules
const queryBrowserTabs = browser.tabs.query({active: true, currentWindow: true});
AddonSettings.loadOptions();
QrLibKjua.init();
const qrCreatorInit = QrCreator.init();
const userInterfaceInit = UserInterface.init();

// generate QR code from tab, if everything is set up
qrCreatorInit.then(() => {
    userInterfaceInit.then(() => {
        queryBrowserTabs.then(QrCreator.generateFromTabs).catch((error) => {
            Logger.logError(error);
            MessageHandler.showError("couldNotReceiveActiveTab");
        });
    });
}).catch(Logger.logError);
