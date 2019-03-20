/**
 * Errors in QR code generation
 *
 * @module QrLib/QrError
 */

export class DataOverflowError extends Error {
    constructor(message, ...params) {
        super(
            message || "The QR code was given too much data.",
            ...params);
    }
}
