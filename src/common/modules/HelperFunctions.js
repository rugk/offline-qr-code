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
 * Recall the function for the given number of maximum retries with a delay when the returned promise is rejected
 *
 * @param {Function} invokedFunction function to retry
 * @param {number} delay retry delay in ms
 * @param {number} maxRetries number of times invokedFunction is invoked
 * @returns {Promise}
 */
export function retryPromise(invokedFunction, delay, maxRetries) {
    return new Promise((resolve, reject) => {
        invokedFunction().then(resolve).catch((error) => {
            if (maxRetries === 0) {
                reject(error);

                return;
            }

            setTimeout(() => {
                retryPromise(invokedFunction, delay, maxRetries - 1).then(resolve);
            }, delay);
        });
    });
}
