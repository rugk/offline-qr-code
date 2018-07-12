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
 * @param {Function} fn function to retry
 * @param {number} delay retry delay in ms
 * @returns {Promise}
 */
export function retryPromise(fn, delay) {
    return new Promise(resolve => {
        fn().then(resolve).catch(() => {
            setTimeout(() => {
                retryPromise(fn, delay).then(resolve);
            }, delay);
        });
    });
}
