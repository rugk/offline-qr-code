/**
 * Load, save and apply options to HTML options page.
 *
 * @module modules/HtmlModification
 */

// common modules
import * as Logger from "/common/modules/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";

/**
 * Remembers options groups with each option to be able to aggreegate them, later.
 *
 * @private
 * @var {Object}
 */
let rememberedOptions;

/**
 * Resets all remembered options.
 *
 * It just cleans the whole {@link rememberedOptions}.
 *
 * @protected
 * @function
 * @returns {void}
 */
export function resetRememberedOptions() {
    rememberedOptions = {};
}

/**
 * Applies option to element.
 *
 * @protected
 * @function
 * @param  {string} option string ob object ID
 * @param  {string|null} optionGroup optiom group, if it is used
 * @param  {HTMLElement} elOption where to apply feature
 * @param  {Object|undefined} optionValues object values
 * @returns {void}
 */
export function applyOptionToElement(option, optionGroup, elOption, optionValues) {
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
 * @protected
 * @function
 * @param  {HTMLElement} elOption the element to read option from
 * @returns {Object} the option value
 */
export function getOptionFromElement(elOption) {
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
 * Returns the option ID and value or all values from an option group associated to it.
 *
 * @protected
 * @function
 * @param  {HTMLElement} elOption the element to read option from
 * @returns {Array.<string, Object>} first the ID, then the option value
 */
export function getIdAndOptionsFromElement(elOption) {
    let option, optionValue;

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

    return [option, optionValue];
}
