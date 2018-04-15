'use strict';

/* globals Logger */
/* globals AddonSettings */
/* globals MessageHandler */
/* globals ADDON_NAME */
/* globals ADDON_NAME_SHORT */
/* globals MESSAGE_LEVEL */

var OptionHandler = (function () {
    let me = {};

    let managedInfoIsShown = false;

    /**
     * Applies option to element.
     *
     * @name   OptionHandler.applyOptionToElementToElement
     * @function
     * @private
     * @param  {string} option string ob object ID
     * @param  {HTMLElement} elOption where to apply feature
     * @param  {object} optionValues object containing the object value
     */
    function applyOptionToElement(option, elOption, optionValues) {
        let optionValue;
        // ignore, if not set, i.e. use default value from HTML file
        if (!optionValues.hasOwnProperty(option)) {
            optionValue = AddonSettings.getDefaultValue(option);

            Logger.logInfo("got default value for applying option", optionValue);

            // if still no default value, try to use HTML defaults, i.e. do not set option
            if (optionValue === undefined) {
                return;
            }
        } else {
            optionValue = optionValues[option];
        }

        // custom handling for special option types
        switch (elOption.getAttribute("type") || elOption.getAttribute("data-type")) {
            case "checkbox":
                if (optionValue === null) {
                    elOption.indeterminate = true;
                } else {
                    elOption.checked = (optionValue == true);
                }
                break;
            case "radiogroup":
                const radioChilds = elOption.children;

                for (const radioElement of radioChilds) {
                    if (radioElement.getAttribute("value") == optionValue) {
                        radioElement.setAttribute("checked", "");
                    }
                }
                break;
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
     * @returns {object} the option value
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
                optionValue = elOption.selected.value;
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
     * @param  {object|undefined} optionValue
     * @returns {Promise} only if called without parameters
     */
    function applyOptionLive(option, optionValue) {
        if (option === undefined) {
            const gettingOption = AddonSettings.get();
            return gettingOption.then((res) => {
                // run for each option, which we handle
                applyOptionLive("popupIconColor", res.popupIconColor);
            });
        }

        switch (option) {
            case "popupIconColor":
                Logger.logInfo("Apply popup icon color directly", optionValue);
                browser.browserAction.setIcon({path: `icons/icon-small-${optionValue}.svg`});
                break;
        }
    }

    /**
     * Saves all settings.
     *
     * @name   OptionHandler.saveOption
     * @function
     * @private
     * @param  {object} event
     */
    function saveOption(event) {
        let elOption = event.target;

        // radio options need special handling, use parent
        if (elOption.getAttribute("type") == "radio") {
            elOption = elOption.parentElement;
            elOption.selected = event.target;
        }

        // do not save if managed
        if (elOption.hasAttribute("disabled")) {
            Logger.logInfo(option, "is disabled, ignore sync setting");
            return;
        }

        const option = elOption.id;
        const optionValue = getOptionFromElement(elOption);
        Logger.logInfo("save option", elOption, optionValue);

        applyOptionLive(option, optionValue);

        browser.storage.sync.set({
            [option]: optionValue
        });
    }

    /**
     * Saves all settings.
     *
     * @name   OptionHandler.saveOptions
     * @function
     * @private
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
     */
    function setManagedOption(option) {
        const gettingOption = browser.storage.managed.get(option);
        gettingOption.then((res) => {
            showManagedInfo();

            const elOption = document.getElementById(option);
            Logger.logInfo("managed config found", res, elOption);

            applyOptionToElement(option, elOption, res);
            // and disable control
            elOption.setAttribute("disabled", "")
            elOption.setAttribute("title", browser.i18n.getMessage("optionIsDisabledBecauseManaged"))
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
     */
    function setOption(option) {
        const gettingOption = browser.storage.sync.get(option);
        gettingOption.then((res) => {
            const elOption = document.getElementById(option);
            Logger.logInfo("sync config found", res, elOption);

            // do not modify if managed
            if (elOption.hasAttribute("disabled")) {
                Logger.logInfo(option, "is disabled, ignore sync setting");
                return;
            }

            applyOptionToElement(option, elOption, res);
        });
    }

    /**
     * Loads all options of the page.
     *
     * @name   OptionHandler.loadOptions
     * @function
     * @private
     */
    function loadOptions() {
        document.querySelectorAll(".setting").forEach((currentElem) => {
            const elementId = currentElem.id;
            setManagedOption(elementId);
            setOption(elementId);
        });
    }

    /**
     * Resets all options.
     *
     * @name   OptionHandler.resetOptions
     * @function
     * @private
     */
    function resetOptions() {
        Logger.logInfo("reset options");

        browser.storage.sync.clear().then(() => {
            loadOptions();

            applyOptionLive();

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
     */
    me.init = function() {
        loadOptions();
        document.querySelectorAll(".save-on-input").forEach((currentElem) => {
            currentElem.addEventListener("input", saveOption);
        });
        document.querySelectorAll(".save-on-change").forEach((currentElem) => {
            currentElem.addEventListener("change", saveOption);
        });
        document.getElementById("resetButton").addEventListener("click", resetOptions)
    };

    return me;
})();

// init module
OptionHandler.init();
