"use strict";

/* globals Logger */
/* globals AddonSettings */
/* globals MessageHandler */

const OptionHandler = (function () {
    const me = {};

    const REMEBER_SIZE_INTERVAL = 500; // sec

    let managedInfoIsShown = false;
    let remeberSizeInterval = null;

    /**
     * Applies option to element.
     *
     * @name   OptionHandler.applyOptionToElementToElement
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
                optionValue = optionValues[optionGroup][option];
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
            const gettingOption = AddonSettings.get();
            return gettingOption.then((res) => {
                // run for each option, which we knw to handle
                applyOptionLive("popupIconColored", res.popupIconColored);
                applyOptionLive("qrCodeSize", res.qrCodeSize);
            });
        }

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

            // enable auto-update of
            if (optionValue.sizeType === "remember") {
                remeberSizeInterval = setInterval((element) => {
                    console.log("int update", element);
                    // update element and ignore disabled status and that is of course wanted
                    setOption("size", "qrCodeSize", element, true);
                }, REMEBER_SIZE_INTERVAL, elQrCodeSize);
            } else if (remeberSizeInterval !== null) {
                clearInterval(remeberSizeInterval);
            }
            break;
        }
        case "popupIconColored":
            Logger.logInfo("Apply popup icon type directly", optionValue);
            if (optionValue === true) {
                browser.browserAction.setIcon({path: "icons/icon-small-colored.svg"});
            } else {
                // reset icon
                browser.browserAction.setIcon({path: null});
            }
            break;
        }

        return null;
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

        let option = elOption.id;
        let optionValue = getOptionFromElement(elOption);

        // if option has a group assigned, first fetch all options of the group for saving
        if (elOption.hasAttribute("data-optiongroup")) {
            option = elOption.getAttribute("data-optiongroup");

            optionValue = {};
            document.querySelectorAll(`[data-optiongroup=${option}]`).forEach((elCurrentOption) => {
                optionValue[elCurrentOption.id] = getOptionFromElement(elCurrentOption);
            });
        }

        Logger.logInfo("save option", elOption, optionValue);

        applyOptionLive(option, optionValue);

        browser.storage.sync.set({
            [option]: optionValue
        }).catch((error) => {
            Logger.logError("could not save option", option, ": ", error);
            MessageHandler.showError("couldNotSaveOption");
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

        MessageHandler.showInfo("someSettingsAreManaged");
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
     * @param  {HtmlElement|null} elOption optional element of the option, will
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
     * If the option is not saved already, it uses the default from the HTML file.
     *
     * @name   OptionHandler.setOption
     * @function
     * @private
     * @param  {string} option name of the option
     * @param  {string|null|undefined} optionGroup name of the option group,
     *                                             undefined will automatically
     *                                             detect the element
     * @param  {HtmlElement|null} elOption optional element of the option, will
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
     * @returns {void}
     */
    function loadOptions() {
        // set each option
        document.querySelectorAll(".setting").forEach((currentElem) => {
            const elementId = currentElem.id;
            let optionGroup = null;
            if (currentElem.hasAttribute("data-optiongroup")) {
                optionGroup = currentElem.getAttribute("data-optiongroup");
            }

            setManagedOption(elementId, optionGroup, currentElem).catch((error) => {
                /* only log warning as that is expected when no manifest file is found */
                Logger.logWarning("could not get managed options", error);

                // now set "real"/"usual" option
                setOption(elementId, optionGroup, currentElem);
            });
        });

        // when finished, apply live elements for values if needed
        applyOptionLive();
    }

    /**
     * Resets all options.
     *
     * @name   OptionHandler.resetOptions
     * @function
     * @private
     * @returns {void}
     */
    function resetOptions() {
        Logger.logInfo("reset options");

        browser.storage.sync.clear().then(() => {
            loadOptions();

            MessageHandler.showSuccess("resettingOptionsWorked");
        }).catch((error) => {
            Logger.logError(error);
            MessageHandler.showSuccess("resettingOptionsFailed");
        });
    }

    /**
     * Localizes static strings in the HTML file.
     *
     * @name   Localizer.init
     * @function
     * @returns {void}
     */
    me.init = function() {
        loadOptions();
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
OptionHandler.init();
