"use strict";

/* globals Logger */
/* globals AddonSettings */
/* globals MESSAGE_LEVEL, MessageHandler */
/* globals RandomTips */

const OptionHandler = (function () {
    const me = {};

    const REMEBER_SIZE_INTERVAL = 500; // sec

    let managedInfoIsShown = false;
    let remeberSizeInterval = null;

    let rememberedOptions;
    let lastOptionsBeforeReset;

    /**
     * Applies option to element.
     *
     * @name   OptionHandler.applyOptionToElement
     * @function
     * @private
     * @param  {string} option string ob object ID
     * @param  {string|null} optionGroup optiom group, if it is used
     * @param  {HTMLElement} elOption where to apply feature
     * @param  {Object|undefined} optionValues object values
     * @returns {void}
     */
    function applyOptionToElement(option, optionGroup, elOption, optionValues) {
        let optionValue;
        // get default value if value is not passed
        if (!optionValues.hasOwnProperty(option) && !optionValues.hasOwnProperty(optionGroup)) {
            if (optionGroup === null) {
                optionValue = AddonSettings.getDefaultValue(option);
            } else {
                optionValue = AddonSettings.getDefaultValue(optionGroup)[option];
            }

            Logger.logInfo("got default value for applying option", option, ":", optionValue);

            // if still no default value, try to use HTML defaults, i.e. do not set option
            if (optionValue === undefined) {
                return;
            }
        } else {
            // as value is present, get value from settings array
            if (optionGroup === null) {
                optionValue = optionValues[option];
            } else {
                const allOptionsInGroup = optionValues[optionGroup];
                optionValue = optionValues[optionGroup][option];

                // save options if needed
                if (!rememberedOptions.hasOwnProperty(optionGroup)) {
                    rememberedOptions[optionGroup] = allOptionsInGroup;
                }
            }
        }

        // custom handling for special option types
        switch (elOption.getAttribute("type") || elOption.getAttribute("data-type")) {
        case "checkbox":
            if (optionValue === null) {
                elOption.indeterminate = true;
            } else {
                elOption.checked = (optionValue === true);
            }
            break;
        case "radiogroup": {
            const radioChilds = elOption.getElementsByTagName("input");

            for (const radioElement of radioChilds) {
                if (radioElement.getAttribute("type") === "radio" &&
                    radioElement.getAttribute("value") === optionValue) {
                    radioElement.setAttribute("checked", "");
                }
            }
            break;
        }
        default:
            // set value
            elOption.value = optionValue;
        }
    }

    /**
     * Returns the option value from an element.
     *
     * @name   OptionHandler.getOptionFromElement
     * @function
     * @private
     * @param  {HTMLElement} elOption the element to read option from
     * @returns {Object} the option value
     */
    function getOptionFromElement(elOption) {
        let optionValue;

        // custom handling for special option types
        switch (elOption.getAttribute("type") || elOption.getAttribute("data-type")) {
        case "checkbox":
            if (elOption.indeterminate === true) {
                optionValue = null;
            } else {
                optionValue = elOption.checked;
            }
            break;
        case "radiogroup":
            // use our custom "selected" method, which contains the selected element
            if (elOption.hasOwnProperty("selected")) {
                optionValue = elOption.selected.value;
            } else {
                // go through all possible elements and decide, which is checked
                const radioChilds = elOption.getElementsByTagName("input");

                for (const radioElement of radioChilds) {
                    if (radioElement.getAttribute("type") === "radio" &&
                            radioElement.hasAttribute("checked")) {
                        optionValue = radioElement.value;
                    }
                }
            }
            break;
        default:
            optionValue = elOption.value;
        }

        return optionValue;
    }

    /**
     * Applies settings directly, if needed.
     *
     * E.g. used when a setting is saved, so it.
     * If no parameters are passed, this gets and applies all options.
     *
     * @name   OptionHandler.applyOptionLive
     * @function
     * @private
     * @param  {string|undefined} option
     * @param  {Object|undefined} optionValue
     * @returns {Promise|null} Promise only if called without parameters
     */
    function applyOptionLive(option, optionValue) {
        if (option === undefined) {
            Logger.logInfo("applying all options live");

            const gettingOption = AddonSettings.get();
            return gettingOption.then((res) => {
                // run for each option, which we know to handle
                applyOptionLive("popupIconColored", res.popupIconColored);
                applyOptionLive("qrCodeSize", res.qrCodeSize);
                applyOptionLive("qrColor", res.qrColor);
                applyOptionLive("qrBackgroundColor", res.qrBackgroundColor);
            });
        }

        Logger.logInfo("applyOptionLive:", option, optionValue);

        switch (option) {
        case "qrCodeSize": {
            const elQrCodeSize = document.getElementById("size");

            if (optionValue.sizeType === "fixed") {
                // round not so nice values to better values
                let sizeValue = Number(optionValue.size);
                // increase number if the difference to next heigher number (dividable by 5) is smaller
                if (sizeValue % 5 >= 3 ) {
                    sizeValue += 5;
                }
                // "divide" by 5 to get only these values
                optionValue.size = sizeValue - (sizeValue % 5);

                elQrCodeSize.value = optionValue.size;
                elQrCodeSize.removeAttribute("disabled");
            } else {
                // disable input of number when remember option is selected
                elQrCodeSize.setAttribute("disabled", "");
            }

            // enable auto-update of size in input field (if changed while settings are open)
            if (optionValue.sizeType === "remember") {
                remeberSizeInterval = setInterval((element) => {
                    // update element and ignore disabled status and that is of course wanted
                    setOption("size", "qrCodeSize", element, true);
                }, REMEBER_SIZE_INTERVAL, elQrCodeSize);
            } else if (remeberSizeInterval !== null) {
                clearInterval(remeberSizeInterval);
            }
            break;
        }

        case "popupIconColored":
            if (optionValue === true) {
                browser.browserAction.setIcon({path: "icons/icon-small-colored.svg"});
            } else {
                // reset icon
                browser.browserAction.setIcon({path: null});
            }
            break;

        case "debugMode":
            Logger.setDebugMode(optionValue);
            break;

        case "qrColor":
        case "qrBackgroundColor": {
            const elQrColor = document.getElementById("qrColor");
            const elQrBackgroundColor = document.getElementById("qrBackgroundColor");

            const qrCodeColor = hexToRgb(elQrColor.value);
            const qrCodeBackgroundColor = hexToRgb(elQrBackgroundColor.value);

            const colorContrast = contrast(qrCodeColor, qrCodeBackgroundColor);
            // TODO: what is the right value here?
            if (colorContrast <= 4) {
                MessageHandler.hideError();
                MessageHandler.showWarning("lowContrastRatio", false);
            } else {
                MessageHandler.hideWarning();
            }

            if (elQrColor.value === elQrBackgroundColor.value) {
                MessageHandler.hideWarning();
                MessageHandler.showError("sameColor", false);
            } else {
                MessageHandler.hideError();
            }
        }
        }

        return null;
    }

    /**
     * Calculates the contrast between the QR code color and the background.
     *
     * @name   OptionHandler.contrast
     * @function
     * @private
     * @param  {Array} rgb1
     * @param  {Array} rgb2
     * @returns {int}
     */
    function contrast(rgb1, rgb2) {
        const colors = [rgb1[0], rgb1[1], rgb1[2], rgb2[0], rgb2[1], rgb2[2]];
        for (let i = 0; i < colors.length; i++) {
            // Formula: https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
            const c = colors[i] / 255;
            // I'm using 0.04045 here instead of 0.03928 because 0.04045 is the number
            // used in the actual sRGB standard.
            // See also: https://github.com/w3c/wcag21/issues/815
            colors[i] = c < 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        }
        // Formula: https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
        const l1 = 0.2126 * colors[0] + 0.7152 * colors[1] + 0.0722 * colors[2];
        const l2 = 0.2126 * colors[3] + 0.7152 * colors[4] + 0.0722 * colors[5];
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    /**
     * Converts a hex color string to RGB.
     *
     * @name   OptionHandler.hexToRgb
     * @function
     * @private
     * @param  {string} hex
     * @returns {Array}
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }

    /**
     * Saves all settings.
     *
     * @name   OptionHandler.saveOption
     * @function
     * @private
     * @param  {Object} event
     * @returns {void}
     */
    function saveOption(event) {
        let elOption = event.target;

        // radio options need special handling, use (closest) parent
        if (elOption.getAttribute("type") === "radio") {
            elOption = elOption.closest("[data-type=radiogroup]");
            elOption.selected = event.target;
        }

        // do not save if managed
        if (elOption.hasAttribute("disabled")) {
            Logger.logInfo(option, "is disabled, ignore sync setting");
            return;
        }

        let option;
        let optionValue;

        // if option has a group assigned, first fetch all options of the group for saving
        if (elOption.hasAttribute("data-optiongroup")) {
            const optionGroup = elOption.getAttribute("data-optiongroup");

            // if options are cached/saved use them to prevent them from getting lost
            if (rememberedOptions.hasOwnProperty(optionGroup)) {
                optionValue = rememberedOptions[optionGroup];
            } else {
                // otherwise just init empty array
                optionValue = {};
            }

            document.querySelectorAll(`[data-optiongroup=${optionGroup}]`).forEach((elCurrentOption) => {
                optionValue[elCurrentOption.id] = getOptionFromElement(elCurrentOption);
            });

            // use group name as ID for saving
            option = optionGroup;
        } else {
            // use ID for saving
            option = elOption.id;
            optionValue = getOptionFromElement(elOption);
        }

        Logger.logInfo("save option", elOption, JSON.parse(JSON.stringify(optionValue)));

        applyOptionLive(option, optionValue);

        browser.storage.sync.set({
            [option]: optionValue
        }).catch((error) => {
            Logger.logError("could not save option", option, ": ", error);
            MessageHandler.showError("couldNotSaveOption", true);
        });
    }

    /**
     * Saves all settings.
     *
     * @name   OptionHandler.showManagedInfo
     * @function
     * @private
     * @returns {void}
     */
    function showManagedInfo() {
        // prevent re-showings for multiple options
        if (managedInfoIsShown) {
            // already shown
            return;
        }

        MessageHandler.showInfo("someSettingsAreManaged", false);
        managedInfoIsShown = true;
    }

    /**
     * Restores the managed options by administrators.
     *
     * They override users selection, so the user control is disabled.
     *
     * @name   OptionHandler.setManagedOption
     * @function
     * @private
     * @param  {string} option name of the option
     * @param  {string|null|undefined} optionGroup name of the option group,
     *                                             undefined will automatically
     *                                             detect the element
     * @param  {HTMLElement|null} elOption optional element of the option, will
     *                                     be autodetected otherwise
     * @returns {Promise}
     */
    function setManagedOption(option, optionGroup, elOption) {
        if (!elOption) {
            elOption = document.getElementById(option);
        }

        if (optionGroup === undefined && elOption.hasAttribute("data-optiongroup")) {
            optionGroup = elOption.getAttribute("data-optiongroup");
        }

        let gettingOption;
        if (optionGroup == null) {
            gettingOption = browser.storage.managed.get(option);
        } else {
            gettingOption = browser.storage.managed.get(optionGroup);
        }

        return gettingOption.then((res) => {
            showManagedInfo();

            Logger.logInfo("managed config found", res, elOption);

            applyOptionToElement(option, optionGroup, elOption, res);
            // and disable control
            elOption.setAttribute("disabled", "");
            elOption.setAttribute("title", browser.i18n.getMessage("optionIsDisabledBecauseManaged"));
            // could also set readonly elOption.setAttribute("readonly", "") //TODO: test
        });
    }

    /**
     * Display option in option page.
     *
     * If the option is not saved already, it uses the default from common.js.
     *
     * @name   OptionHandler.setOption
     * @function
     * @private
     * @param  {string} option name of the option
     * @param  {string|null|undefined} optionGroup name of the option group,
     *                                             undefined will automatically
     *                                             detect the element
     * @param  {HTMLElement|null} elOption optional element of the option, will
     *                                     be autodetected otherwise
     * @param  {bool} ignoreDisabled set to true to ignore disabled check
     * @returns {Promise|void}
     */
    function setOption(option, optionGroup, elOption, ignoreDisabled) {
        if (!elOption) {
            elOption = document.getElementById(option);
        }

        if (optionGroup === undefined && elOption.hasAttribute("data-optiongroup")) {
            optionGroup = elOption.getAttribute("data-optiongroup");
        }

        let gettingOption;
        if (optionGroup == null) {
            gettingOption = browser.storage.sync.get(option);
        } else {
            gettingOption = browser.storage.sync.get(optionGroup);
        }

        return gettingOption.then((res) => {
            Logger.logInfo("sync config found", JSON.parse(JSON.stringify(res)), elOption);

            // do not modify if managed
            if (ignoreDisabled !== true && elOption.hasAttribute("disabled")) {
                Logger.logInfo(option, "is disabled, ignore sync setting");
                return;
            }

            applyOptionToElement(option, optionGroup, elOption, res);
        });
    }

    /**
     * Loads all options of the page.
     *
     * @name   OptionHandler.loadOptions
     * @function
     * @private
     * @returns {Promise}
     */
    function loadOptions() {
        // reset remembered options to prevent arkward errors when reloading of the options happens
        rememberedOptions = {};
        const allPromises = [];

        // needs to reset some custom options, as they may prevent (correctly) loading settings later
        const elQrCodeSize = document.getElementById("size");
        elQrCodeSize.removeAttribute("disabled");

        // set each option
        document.querySelectorAll(".setting").forEach((currentElem, index) => {
            const elementId = currentElem.id;
            let optionGroup = null;
            if (currentElem.hasAttribute("data-optiongroup")) {
                optionGroup = currentElem.getAttribute("data-optiongroup");
            }

            allPromises[index] = setManagedOption(elementId, optionGroup, currentElem).catch((error) => {
                /* only log warning as that is expected when no manifest file is found */
                Logger.logWarning("could not get managed options", error);

                // now set "real"/"usual" option
                return setOption(elementId, optionGroup, currentElem);
            });
        });

        // when everything is finished, apply live elements for values if needed
        const allOptionsLoaded = Promise.all(allPromises);
        allOptionsLoaded.then(() => {
            applyOptionLive();
        });

        return allOptionsLoaded;
    }

    /**
     * Resets all options.
     *
     * @name   OptionHandler.resetOptions
     * @function
     * @private
     * @param {Event} event
     * @returns {void}
     */
    async function resetOptions(event) {
        Logger.logInfo("reset options");

        // disable reset button (which triggered this) until process is running
        event.target.setAttribute("disabled", "");

        // temporarily save old options
        await browser.storage.sync.get().then((options) => {
            lastOptionsBeforeReset = options;
        });

        // cleanup resetted cached option after message is hidden
        MessageHandler.setHook(MESSAGE_LEVEL.SUCCESS, null, () => {
            lastOptionsBeforeReset = null;
            Logger.logInfo("reset options message hidden, undo vars cleaned");
        });

        // finally reset options
        browser.storage.sync.clear().then(() => {
            return loadOptions().then(() => {
                MessageHandler.showSuccess("resettingOptionsWorked", true, {
                    text: "messageUndoButton",
                    action: () => {
                        browser.storage.sync.set(lastOptionsBeforeReset).then(() => {
                            // re-load the options again
                            loadOptions();
                        }).catch((error) => {
                            Logger.logError("Could not undo option resetting: ", error);
                            MessageHandler.showError("couldNotUndoAction");
                        }).finally(() => {
                            MessageHandler.hideSuccess();
                        });
                    }
                });
            });
        }).catch((error) => {
            Logger.logError(error);
            MessageHandler.showError("resettingOptionsFailed", true);
        }).finally(() => {
            // re-enable button
            event.target.removeAttribute("disabled");
        });
    }

    /**
     * Initializes the options.
     *
     * @name   OptionHandler.init
     * @function
     * @returns {void}
     */
    me.init = function() {
        loadOptions().catch((error) => {
            Logger.logError(error);
            MessageHandler.showError("couldNotLoadOptions", false);
        });

        document.querySelectorAll(".save-on-input").forEach((currentElem) => {
            currentElem.addEventListener("input", saveOption);
        });
        document.querySelectorAll(".save-on-change").forEach((currentElem) => {
            currentElem.addEventListener("change", saveOption);
        });
        document.getElementById("resetButton").addEventListener("click", resetOptions);
    };

    return me;
})();

// init module
AddonSettings.loadOptions();
OptionHandler.init();
RandomTips.init().then(() => {
    RandomTips.setContext("options");
    RandomTips.showRandomTipIfWanted();
});
