/**
 * Errors in QR code generation
 *
 * @module QrLib/qrerr
 */

export class DataOverflowError extends Error {
  constructor(...params) {
    super(...params);
    this.message = 'data overflow error';
  }
}
