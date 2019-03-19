/**
 * Errors in QR code generation
 *
 * @module QrLib/QrErrors
 */

export class DataOverflowError extends Error {
    constructor(...rparams) {
        let params = rparams.length>0
            ? rparams : ["The QR code was given too much data."];
        super(...params);
    }
}
