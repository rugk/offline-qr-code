/**
 * Try fn when the return promise is rejected
 * @param {Function} fn function to retry
 * @param {number} ms retry delay in ms
 * @returns {Promise}
 */
const retryPromise = (fn, ms) => new Promise(resolve => {
    fn().then(resolve).catch(() => {
        setTimeout(() => {
            retryPromise(fn, ms).then(resolve);
        }, ms);
    });
});

export default retryPromise;
