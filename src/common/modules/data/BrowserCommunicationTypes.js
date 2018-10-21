/**
 * All available communication types
 *
 * @module data/browserCommunicationTypes
 */

/**
 * An array of all tips.
 *
 * @const
 * @type {Object.<string, string>}
 */
export const COMMUNICATION_MESSAGE_TYPE = Object.freeze({
    SET_QR_TEXT: "setQrText",
    SAVE_FILE_AS: "saveFileAs",
    SAVE_FILE_AS_STOP_RETRY: "saveFileAsStopRetry"
});
