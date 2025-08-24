/**
 * Management of GUI elements
 *
 * @module modules/UserInterface
 * @requires /common/modules/lodash/isObject
 * @requires /common/modules/lodash/throttle
 * @requires /common/modules/data/MessageLevel
 * @requires /common/modules/AddonSettings
 * @requires /common/modules/MessageHandler
 * @requires ./QrLib/QrErrors
 * @requires ./QrCreator
 */
// lodash
import isObject from "/common/modules/lodash/isObject.js";
import throttle from "/common/modules/lodash/throttle.js";

import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as CommonMessages from "/common/modules/MessageHandler/CommonMessages.js";

import * as QrError from "./QrLib/QrError.js";
import * as QrCreator from "./QrCreator.js";
import { createMenu } from "/common/modules/ContextMenu.js";

const TOP_SCROLL_TIMEOUT = 20; // ms
const QR_CODE_REFRESH_TIMEOUT = 200; // ms
const QR_CODE_CONTAINER_MARGIN = 40; // px
const QR_CODE_SIZE_SNAP = 5; // px
const QR_CODE_SIZE_DECREASE_SNAP = 2; // px
const WINDOW_MINIMUM_HEIGHT = 250; // px
const THROTTLE_SIZE_SAVING_FOR_REMEMBER = 500; // ms

const CONTEXT_MENU_SAVE_IMAGE_CANVAS = "save-image-canvas";
const CONTEXT_MENU_SAVE_IMAGE_SVG = "save-image-svg";

const DOWNLOAD_PERMISSION = {
    permissions: ["downloads"],
};

const qrCode = document.getElementById("qrcode");
const qrCodePlaceholder = document.getElementById("qrcode-placeholder");
const qrCodeContainer = document.getElementById("qrcode-container");
const qrCodeResizeContainer = document.getElementById(
    "qrcode-resize-container"
);
const qrCodeText = document.getElementById("qrcodetext");

let resizeMutationObserver;

let placeholderShown = true;

// default/last size
if (localStorage.getItem("lastSize") === null) {
    localStorage.setItem("lastSize", 200);
}
let qrLastSize = parseInt(localStorage.getItem("lastSize"));

let qrCodeSizeOption = {};
let savingQrCodeSize = null; // promise

/**
 * Hide QR code and show placeholder instead.
 *
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
 * @function
 * @name saveConfig
 * @private
 * @returns {void}
 */
const refreshQrCode = throttle(() => {
    const text = qrCodeText.value;
    console.info("new value from textarea: ", text);

    // show placeholder when no text is entered
    if (text === "") {
        showPlaceholder();
        return;
    } else if (placeholderShown) {
        hidePlaceholder();
        CommonMessages.hideError();
    }

    try {
        QrCreator.setTextInternal(text);
        QrCreator.generate();
    } catch (e) {
        handleQrError(e);
    }
}, QR_CODE_REFRESH_TIMEOUT);

/**
 * Returns whether an (inpout/textare/…) element is selected or not.
 *
 * @function
 * @private
 * @param {HTMLElement} input the input element this is about
 * @returns {bool}
 */
function isSelected(input) {
    return (
        input.selectionStart === 0 && input.selectionEnd === input.value.length
    );
}

/**
 * Selects all text of a textarea.
 *
 * @function
 * @private
 * @param {Event} event
 * @returns {void}
 */
function selectAllText(event) {
    const targetIsSelected =
        document.activeElement === event.target && isSelected(event.target);

    console.info("selectAllText", event);

    // re-selecting when already selected, causes flashing, so we avoid that
    if (!targetIsSelected) {
        event.target.focus();
        event.target.select();
    }

    // set scroll position to top one, because you want to see the
    // start of an URL
    // (selecting makes the scroll position go to the bottom)

    setTimeout(scrollToTop, TOP_SCROLL_TIMEOUT, event);
}

/**
 * Scrolls to the top of the element.
 *
 * @function
 * @private
 * @param {Event} event
 * @returns {void}
 */
function scrollToTop(event) {
    console.info("scrollToTop", event);
    event.target.scrollTo(0, 0);
}

/**
 * Saves the QR code size option (to remember the size).
 *
 * @function
 * @private
 * @returns {Promise}
 */
async function saveQrCodeSizeOption() {
    // never start saving an option, when the old one is still being saved
    await savingQrCodeSize;

    console.info("saved qr code text size/style", qrCodeSizeOption);

    savingQrCodeSize = browser.storage.sync.set({
        qrCodeSize: qrCodeSizeOption,
    });
    return savingQrCodeSize;
}

/**
 * Regularely calls saveQrCodeSizeOption to save the option, but not too often.
 *
 * This depends on the throttle function from lodash.
 *
 * @function
 * @name throttledSaveQrCodeSizeOption
 * @private
 */
const throttledSaveQrCodeSizeOption = throttle(
    saveQrCodeSizeOption,
    THROTTLE_SIZE_SAVING_FOR_REMEMBER
);

/**
 * Sets the new size of the QR code.
 *
 * @function
 * @private
 * @param {int} newSize the new size in px
 * @param {bool} regenerateQr whether the QR code should be regenerated (default: false)
 * @returns {void}
 */
function setNewQrCodeSize(newSize, regenerateQr) {
    // apply new size
    QrCreator.setSize(newSize);

    if (qrCodeSizeOption.sizeType !== "auto") {
        qrCodeResizeContainer.style.width = `${newSize}px`;
        qrCodeResizeContainer.style.height = `${newSize}px`;
    }

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
 * @function
 * @private
 * @returns {Promise} to go on
 */
function saveQrCodeTextSize() {
    // if setting is disabled, ignore and always return a successful promise
    if (qrCodeSizeOption.sizeType !== "remember") {
        return Promise.resolve();
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
 * Resize the UI elements when the popup (actually the textarea box), etc. is resized.
 *
 * @function
 * @private
 * @returns {void}
 */
function resizeElements() {
    const newQrCodeSize =
        Math.min(qrCodeContainer.offsetHeight, qrCodeContainer.offsetWidth) -
        QR_CODE_CONTAINER_MARGIN;
    const qrSizeDiff = newQrCodeSize - qrLastSize;

    // rezizing at small window heights (e.g. when popup is being constructed)
    // could cause it to be resized to 0px or so
    const windowHeight = window.innerHeight;
    if (windowHeight < WINDOW_MINIMUM_HEIGHT) {
        console.info("Skipped resize due to low window height", windowHeight);
        return;
    }

    // do not resize if size is not *increased* by 5 px or *decreased* by 2px
    if (
        qrSizeDiff < QR_CODE_SIZE_SNAP &&
        qrSizeDiff > -QR_CODE_SIZE_DECREASE_SNAP
    ) {
        // but allow resize of input text, if needed
        saveQrCodeTextSize();

        return;
    }

    console.info("resize QR code from ", qrLastSize, " to ", newQrCodeSize);

    // do not regenerate QR code if an error or so is shown
    setNewQrCodeSize(newQrCodeSize, !placeholderShown);
}

/**
 * Executes resizeElements, but only when a frame is rendered.
 *
 * This depends on the thottle function from lodash that uses requestAnimationFrame.
 *
 * @function
 * @name throttledResizeElements
 * @private
 */
const throttledResizeElements = throttle(resizeElements);

/**
 * Shows the given text in the QR code's input field.
 *
 * Note that this also triggers the actions to show it nicely in the UI.
 *
 * @function
 * @param  {string} text* *
 * @returns {void}
 */
export function setQrInputFieldText(text) {
    qrCodeText.textContent = text;

    // as text has been changed, we need to focus
    qrCodeText.focus();
}

/**
 * Get the acual QR code element.
 *
 * @function
 * @returns {HTMLElement}
 */
export function getQrCodeElement() {
    return qrCode.firstElementChild;
}

/**
 * Replace the QR code element with this (new) one.
 *
 * @function
 * @param  {HTMLElement} elNewQr
 * @returns {void}
 */
export function replaceQr(elNewQr) {
    // get old element
    const elOldQrCode = getQrCodeElement();

    // and replace it
    console.info("replace qr code from", elOldQrCode, "to", elNewQr);
    qrCode.replaceChild(elNewQr, elOldQrCode);
}

/**
 * Shows an error message for a QR code error or similar.
 *
 * @function
 * @param {Error} error
 * @returns {void}
 * @throws {Error} if error could not be handled
 */
export function handleQrError(error) {
    // error thrown from qrcodegen & kjua wrapper when text input is too long
    if (error instanceof QrError.DataOverflowError) {
        CommonMessages.showError("errorQrCodeOverflow");
        console.error("Maximum size of QR code data exceeded.");
    } else {
        throw error;
    }
}

/**
 * Save a file.
 *
 * Sends a message to the background script to request the permissions and download the file.
 *
 * @function
 * @private
 * @param {File} file
 * @param {string} filename
 * @param {Promise} requestDownloadPermissions required permission request via browser.permissions.request
 * @returns {void}
 */
function triggerFileSave(file, filename, requestDownloadPermissions) {
    const downloadPermissionGranted =
        browser.permissions.contains(DOWNLOAD_PERMISSION);

    downloadPermissionGranted.then((isAlreadyGranted) => {
        let usePermissionWorkaround = false;

        // if permission is not yet required
        // workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1292701
        if (!isAlreadyGranted) {
            usePermissionWorkaround = true;
            CommonMessages.showInfo("requestDownloadPermissionForQr");
        }

        browser.runtime
            .sendMessage({
                type: COMMUNICATION_MESSAGE_TYPE.SAVE_FILE_AS,
                usePermissionWorkaround: usePermissionWorkaround,
                file: file,
                filename: filename,
            })
            .then(() => {
                console.info("image saved on disk", file, filename);
            })
            .catch((error) => {
                console.error(
                    "Could not save SVG image saved on disk",
                    error,
                    file,
                    filename
                );

                // in case of user error (i.e. user cancelled e.g.) do not show error message
                if (error.message.includes("user")) {
                    return;
                }

                CommonMessages.showError("errorDownloadingFile", error);
            });

        // show error when promise is rejected
        requestDownloadPermissions
            .then((permissionGranted) => {
                if (usePermissionWorkaround) {
                    // if permission result is there, hide info message
                    CommonMessages.hideInfo();
                }

                // in case of success there is nothing else to do
                if (permissionGranted) {
                    return;
                }

                // and stop retrying to download in background script
                if (usePermissionWorkaround) {
                    browser.runtime.sendMessage({
                        type: COMMUNICATION_MESSAGE_TYPE.SAVE_FILE_AS_STOP_RETRY,
                    });
                }

                // if permission is declined, make user aware that this permission was required
                console.error(
                    "Permission request for",
                    DOWNLOAD_PERMISSION,
                    "declined."
                );
                CommonMessages.showError("errorPermissionRequired", true);
            })
            .catch((error) => {
                console.error(
                    "Permission request for",
                    DOWNLOAD_PERMISSION,
                    "failed:",
                    error
                );
                CommonMessages.showError("errorPermissionRequestFailed", true);
            });
    });
}

/**
 * If qrcode text was an URL i.e contains :// this function generates a filename using the domain and replacing all special characters with _
 *.If not return "qrcode"
 *
 * @private
 * @function
 * @returns {filename}
 */
function generateFilename() {
    let qrCodeInputText = qrCodeText.value; // get current value from input
    let url;

    try {
        url = new URL(qrCodeInputText);
        // throws "TypeError: URL constructor:  is not a valid URL." if it's not
        // valid URL
    } catch (e) {
        return "qrcode";
    }

    let filename = url.host;
    // fallback to protocol + path (for special URLs like about:config etc.)
    filename = filename || `${url.protocol}${url.pathname}`;
    // Replace "." and all strange characters by _
    filename = filename.replace(/[^a-z0-9_-]/g, "-");

    // if filename has no characters, fall back to simple string
    if (!filename) {
        return "qrcode";
    }

    // prepend "qrcode"
    return `qrcode_${filename}`;
}

/**
 * Triggers when a context menu item has been clicked.
 *
 * It downloads the QR code image.
 *
 * @function
 * @private
 * @param {event} event
 * @returns {void}
 */
function menuClicked(event) {
    const requestDownloadPermissions =
        browser.permissions.request(DOWNLOAD_PERMISSION);
    let filename = generateFilename();

    switch (event.menuItemId) {
        case CONTEXT_MENU_SAVE_IMAGE_SVG: {
            filename = filename + ".svg";
            const svgElem = QrCreator.getQrCodeSvgFromLib();
            const svgString = new XMLSerializer().serializeToString(svgElem);
            const file = new File([svgString], filename, {
                type: "image/svg+xml;charset=utf-8",
            });
            triggerFileSave(file, filename, requestDownloadPermissions);
            break;
        }
        case CONTEXT_MENU_SAVE_IMAGE_CANVAS: {
            filename = filename + ".png";
            const canvasElem = QrCreator.getQrCodeCanvasFromLib();
            canvasElem.toBlob((blob) => {
                const file = new File([blob], filename, { type: "image/png" });
                triggerFileSave(file, filename, requestDownloadPermissions);
            }, "image/png");
            break;
        }
    }
}

/**
 * Creates the context menu entries for the popup.
 *
 * @private
 * @returns {Promise}
 */
async function createContextMenu() {
    // ignore if menu API is not supported (on Android e.g.)
    if (browser.menus === undefined) {
        return Promise.resolve();
    }

    // remove menu item if it has been added before
    browser.menus.remove(CONTEXT_MENU_SAVE_IMAGE_CANVAS);
    browser.menus.remove(CONTEXT_MENU_SAVE_IMAGE_SVG);

    // create save menus if needed
    await createMenu("contextMenuSaveImageSvg", {
        id: CONTEXT_MENU_SAVE_IMAGE_SVG,
        contexts: ["page"],
        documentUrlPatterns: [
            document.URL, // only apply to own URL = popup
        ],
    });
    await createMenu("contextMenuSaveImageCanvas", {
        id: CONTEXT_MENU_SAVE_IMAGE_CANVAS,
        contexts: ["page"],
        documentUrlPatterns: [
            document.URL, // only apply to own URL = popup
        ],
    });

    browser.menus.onClicked.addListener(menuClicked);
    return Promise.resolve();
}

/**
 * Do things after whole initialisation completed.
 *
 * This will only run onceper page load.
 *
 * @function
 * @returns {void}
 */
export function lateInit() {
    // start listening for resize events very late, so that it does not
    // conflict with restoring the popup size
    resizeMutationObserver.observe(qrCodeText, {
        attributes: true,
        attributeFilter: ["style"],
    });
}

/**
 * Initiates directly after the QR code has been generated, but only in the
 * initialisation phase.
 *
 * @function
 * @returns {void}
 */
export function postInitGenerate() {
    selectAllText({ target: qrCodeText });
}

/**
 * Initalises the module.
 *
 * @function
 * @returns {Promise}
 */
export function init() {
    // set error hooks
    CommonMessages.setLoadingHook(showPlaceholder, hidePlaceholder);
    CommonMessages.setErrorHook(() => {
        // hide loading first as this may hide the placeholder
        CommonMessages.hideLoading();

        showPlaceholder();
    }, hidePlaceholder);

    // add event listeners
    qrCodeText.addEventListener("input", refreshQrCode);
    qrCodeText.addEventListener("focus", selectAllText);

    const applyingMonospaceFont = AddonSettings.get("monospaceFont").then(
        (monospaceFont) => {
            if (monospaceFont) {
                qrCodeText.style.fontFamily = "monospace";
            }
        }
    );

    const applyingQrColor = AddonSettings.get("qrBackgroundColor").then(
        (qrBackgroundColor) => {
            if (qrBackgroundColor) {
                document.body.style.backgroundColor = qrBackgroundColor;
            }
        }
    );

    // for some very strange reason, the MutationObserver only works when it is initiated as fast as possible gives better performance when resizing later
    resizeMutationObserver = new MutationObserver(throttledResizeElements);

    const applyingQrSize = AddonSettings.get("qrCodeSize").then(
        async (qrCodeSize) => {
            // save as module variable
            qrCodeSizeOption = qrCodeSize;

            if (qrCodeSize.sizeType === "auto") {
                // do not resize QR code, but center it horizontally (SVG maximizes automatically)
                qrCodeResizeContainer.style.width = "auto";
            }

            if (
                qrCodeSize.sizeType === "remember" ||
                qrCodeSize.sizeType === "fixed"
            ) {
                await QrCreator.qrCreatorInit;

                if (qrLastSize === qrCodeSize.size) {
                    console.info(
                        "QR code last size is the same as current setting, so do not reset"
                    );
                    // BUT set CSS stuff to make it consistent
                    setNewQrCodeSize(qrCodeSize.size, false);
                } else {
                    // regenerate QR code
                    setNewQrCodeSize(qrLastSize, true);
                }
            }

            // also set height of text (also to prevent display errors) when remember is enabled
            if (
                qrCodeSize.sizeType === "remember" &&
                qrCodeSize.hasOwnProperty("sizeText")
            ) {
                console.info("restore qr code text size:", qrCodeSize.sizeText);
                // is saved as CSS string already
                // height is NOT (anymore) restored, as this may cause display errors (likely due to different content-box settings) and the height does not matter, anyway
                qrCodeText.style.width = qrCodeSize.sizeText.width;

                // detect too small size
                const minimalSize =
                    qrCodeSize.size + parseInt(qrCodeSize.sizeText.height, 10);
                if (window.innerHeight < minimalSize) {
                    console.error(
                        "too small size",
                        window.innerHeight,
                        "should be at least: ",
                        minimalSize
                    );
                }
            }
        }
    );

    const initQrTypespecificSettings = createContextMenu();

    // return Promise chain
    return Promise.all([
        applyingMonospaceFont,
        applyingQrSize,
        applyingQrColor,
        initQrTypespecificSettings,
    ]);
}

/**
 * Listens to Alt + plus/minus keypresses to alter 
 * QR code size.
 */
document.addEventListener('keydown', function(event) {
    if ((event.key == '=' || event.key == '+') && event.altKey && qrLastSize < 440) {
        setNewQrCodeSize(qrLastSize + 30, true);

        localStorage.setItem("lastSize", qrLastSize);
    }
    if (event.key == '-' && event.altKey && qrLastSize > 50) {
        setNewQrCodeSize(qrLastSize - 30, true);

        localStorage.setItem("lastSize", qrLastSize);
    }
});