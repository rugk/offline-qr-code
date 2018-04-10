'use strict';

/* globals Logger */
/* globals ADDON_NAME */
/* globals ADDON_NAME_SHORT */

var OptionHandler = (function () {
    let me = {};

    let managedInfoIsShown = false;

    /**
     * Applies option to element.
     *
     * @name   OptionHandler.applyOptionToElementToElement
     * @function
     * @private
     * @param  {HTMLElement} elOption where to apply feature
     * @param  {object} optionValue value to apply
     */
    function applyOptionToElement(elOption, optionValue) {
        // ignore, if not set, i.e. use default value from HTML file
        if (optionValue == "") {
            return;
        }

        // custom handling for special option types
        switch (elOption.getAttribute("type")) {
            case "checkbox":
                if (optionValue === null) {
                    elOption.indeterminate = true;
                } else {
                    elOption.checked = (optionValue == true);
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
        switch (elOption.getAttribute("type")) {
            case "checkbox":
                if (elOption.indeterminate === true) {
                    optionValue = null;
                } else {
                    optionValue = elOption.checked;
                }
                break;
            default:
                optionValue = elOption.value;
        }

        return optionValue;
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
        const elOption = event.target;

        // do not save if managed
        if (elOption.hasAttribute("disabled")) {
            Logger.logInfo(option, "is disabled, ignore sync setting");
            return;
        }

        const optionValue = getOptionFromElement(elOption);
        Logger.logInfo("save option", elOption, optionValue);

        browser.storage.sync.set({
            [elOption.id]: optionValue
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
        if (managedInfoIsShown) {
            // already shown
            return;
        }

        const elMangedInfo = document.getElementById("managed-settings");

        elMangedInfo.classList.remove("invisible");
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

            applyOptionToElement(elOption, res[option]);
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

            applyOptionToElement(elOption, res[option]);
        });
    }

    /**
     * Localizes static strings in the HTML file.
     *
     * @name   Localizer.init
     * @function
     */
    me.init = function() {
        document.querySelectorAll(".setting").forEach((currentElem) => {
            const elementId = currentElem.id;
            setManagedOption(elementId);
            setOption(elementId);
        });
        document.querySelectorAll(".save-on-input").forEach((currentElem) => {
            currentElem.addEventListener("input", saveOption);
        });
        document.querySelectorAll(".save-on-change").forEach((currentElem) => {
            currentElem.addEventListener("change", saveOption);
        });
    };

    return me;
})();

// init module
OptionHandler.init();
