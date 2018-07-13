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

/**
 * Recall the function with a delay when the returned promise is rejected
 *
 * @param {Function} invokedFunction function to retry
 * @param {number} delay retry delay in ms
 * @returns {Promise}
 */
export function retryPromise(invokedFunction, delay) {
    return new Promise(resolve => {
        invokedFunction().then(resolve).catch(() => {
            setTimeout(() => {
                retryPromise(invokedFunction, delay).then(resolve);
            }, delay);
        });
    });
}
