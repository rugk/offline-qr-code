/**
 * Load, save and apply options to HTML options page.
 *
 * @module internal/HtmlModification
 * @requires /common/modules/Logger
 */

// common modules
import * as Logger from "../../Logger/Logger.js";

import * as OptionsModel from "./OptionsModel.js";

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
 * If the option is not saved already, it uses the default provided by the
 * {@link AddonSettings} module.
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
            optionValue = OptionsModel.getDefaultOption(option);
        } else {
            optionValue = OptionsModel.getDefaultOption(optionGroup)[option];
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
 * Returns the selected HTMLElement in a radio group.
 *
 * @private
 * @function
 * @param  {HTMLElement} elOption the element to read option from
 * @returns {HTMLElement} the selected HTMLElement
 * @throws {Error} if nothing is selected
 */
function getSelectedFromRadioGroup(elOption) {
    // use our custom "selected" property, which contains the selected element
    if (elOption.selectedElement !== undefined) {
        return elOption.selectedElement;
    } else {
        // go through all possible elements and decide, which is checked
        const radioChilds = elOption.getElementsByTagName("input");

        for (const radioElement of radioChilds) {
            if (radioElement.getAttribute("type") === "radio" &&
                    radioElement.hasAttribute("checked")) {
                return radioElement;
            }
        }
    }

    // TODO: change error handling?
    throw new Error("no radio element is selected");
}

/**
 * Returns the option ID from the element.
 *
 * @package
 * @function
 * @param  {HTMLElement} elOption the element to read option from
 * @returns {string} the option ID
 */
export function getOptionIdFromElement(elOption) {
    return elOption.getAttribute("name") || elOption.dataset.name;
}

/**
 * Returns the option value from an element.
 *
 * @private
 * @function
 * @param  {HTMLElement} elOption the element to read option from
 * @returns {Array.<string, Object>} first the ID, then the option value
 */
function getIdAndOptionFromElement(elOption) {
    let optionId, optionValue;

    // custom handling for special option types
    switch (elOption.getAttribute("type") || elOption.getAttribute("data-type")) {
    case "checkbox":
        if (elOption.indeterminate === true) {
            optionValue = null;
        } else {
            optionValue = elOption.checked;
        }
        break;
    case "radiogroup": {
        const elSelected = getSelectedFromRadioGroup(elOption);
        optionId = getOptionIdFromElement(elSelected);
        optionValue = elSelected.value;
        break;
    }
    case "number":
        // as value is commonly read as string we need to convert it
        optionValue = Number(elOption.value);
        break;
    case "range":
        // as value is commonly read as string we need to convert it
        optionValue = Number(elOption.value);
        break;
    default:
        optionValue = elOption.value;
    }

    if (optionId === undefined) {
        optionId = getOptionIdFromElement(elOption);
    }

    return [optionId, optionValue];
}

/**
 * Returns the option ID and value or all values from an option group associated to it.
 *
 * @protected
 * @function
 * @param  {HTMLElement} elOption the element to read option from
 * @param  {boolean} useDatagroup set to false to ignore the datagroup
 * @returns {Array.<string, Object>} first the ID, then the option value
 */
export function getIdAndOptionsFromElement(elOption, useDatagroup = true) {
    let option, optionValue;

    // if option has a group assigned, first fetch all options of the group for saving
    if (useDatagroup && "optiongroup" in elOption.dataset) {
        const optionGroup = elOption.dataset.optiongroup;

        // if options are cached/saved use them to prevent them from getting lost
        if (optionGroup in rememberedOptions) {
            optionValue = rememberedOptions[optionGroup];
        } else {
            // otherwise just init empty array
            optionValue = {};
        }

        document.querySelectorAll(`[data-optiongroup=${optionGroup}]`).forEach((elCurrentOption) => {
            const [currentOption, currentOptionValue] = getIdAndOptionFromElement(elCurrentOption);
            optionValue[currentOption] = currentOptionValue;
        });

        // use group name as ID for saving
        option = optionGroup;
        return [option, optionValue];
    } else {
        // use ID for saving
        [option, optionValue] = getIdAndOptionFromElement(elOption);
    }

    return [option, optionValue];
}
