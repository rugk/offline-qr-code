/**
 * Errors in QR code generation
 *
 * @module QrLib/QrErrors
 */

export class DataOverflowError extends Error {
    constructor(...params) {
        super(...params);
        this.message = "The QR code was given too much data.";
    }
}
