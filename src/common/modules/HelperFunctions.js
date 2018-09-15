/**
 * Common functiom useful for all scripts.
 *
 * Basically lodash lite ;).
 *
 * @module /common/modules/HelperFunctions
 */
"use strict";

/**
 * Determinates whether an object is empty or not.
 *
 * @function
 * @param  {Object} obj
 * @returns {boolean}
 */
export function objectIsEmpty(obj) { // eslint-disable-line no-unused-vars
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}
