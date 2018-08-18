/**
 * Wait for a defined amount of time (and optionally) do something afterwards.
 *
 * @function
 * @param {int} timeInMs the time to wait
 * @param {function} doAfterwards a function to execute afterwards
 * @returns {void}
 */
export function wait(timeInMs, doAfterwards) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(doAfterwards);
        }, timeInMs);
    });
}
