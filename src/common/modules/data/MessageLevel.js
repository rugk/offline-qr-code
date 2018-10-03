/**
 * Contains a static object for messages.
 *
 * @module /common/modules/data/MessageLevel
 */

/**
 * Specifies the message level to use,
 *
 * @readonly
 * @enum {int}
 * @default
 */
export const MESSAGE_LEVEL = Object.freeze({
    "ERROR": 3,
    "WARN": 2,
    "INFO": 1,
    "LOADING": -2,
    "SUCCESS": -3
});
