/**
 * The setting for a tip, represented in an object.
 *
 * @typedef {Object} TipObject
 * @property {string} id just some ID
 * @property {integer|null} requireShowCount shows the message x times; set
 * to "null" to show infinitively
 * @property {bool} [allowDismiss=true] set to false to disallow dismissing
 * the message. This likely makes no sense for any tip, so the default is true.
 * @property {bool|integer} [requireDismiss=true] require that message is
 * dismissed to count as a requireShowCount. True enables this, with any integer
 * you can specify a lower value to only require x dismisses.
 * @property {integer|null} [maximumDismiss=null] hides the message, if it
 * has been dismissed x times.
 * @property {integer} [requiredTriggers=10] require some displays ("triggers")
 * of (any) add-on page before showing tip. This is effectively just a minimum
 * limit, so it is not shown too "early".
 * @property {Object.<string: bool>} [showInContext] a key-value object with
 * context -> num to require the tip to be shown in a specific context for the
 * given number of times. See {@link RandomTips.setContext}.
 * @property {Object.<string: bool>} [maximumInContest] a key-value object with
 * context -> num to only show the tip in a specific context at most for the
 * given number of times. See {@link RandomTips.setContext}.
 * @property {bool|integer} [randomizeDisplay] Randomizes the display with a
 * chance of 50% by default (when set to "true"). You can override that percentage
 * (as an integer, e.g. 0.2 instead of 20%).
 * Note that the tip message display in general is already randomized
 * with a chance of 20%, see {@link RandomTips.GLOBAL_RANDOMIZE}.
 * @property {string} text  The text to actually show. It is passed to the
 * {@link MessageHandler}, so you can (& should) use a translatable string here.
 * @property {Object} [actionButton] adds an action button to the message // TODO: document action button
 */

/**
 * The list of all tips.
 *
 * @const
 * @type {Array.<TipObject>}
 */
export const tips = Object.freeze([
    {
        id: "likeAddon",
        requireShowCount: 3,
        requireDismiss: 1,
        maximumDismiss: 2,
        requiredTriggers: 10,
        showInContext: {
            "popup": 1
        },
        randomizeDisplay: false,
        text: "tipYouLikeAddon",
        actionButton: {
            text: "tipYouLikeAddonButton",
            action: "https://addons.mozilla.org/firefox/addon/offline-qr-code-generator/reviews/"
        }
    },
    {
        id: "saveQr",
        requireShowCount: 5,
        requireDismiss: 1,
        maximumDismiss: 2,
        requiredTriggers: 5,
        showInContext: {
            "popup": 1
        },
        randomizeDisplay: false,
        text: "tipSaveQrCode",
        actionButton: {
            text: "tipLearnMore",
            action: "https://github.com/rugk/offline-qr-code/wiki/FAQ#how-to-save-the-qr-code-on-disk"
        }
    },
    {
        id: "donate",
        // do not show on options page as Firefox already displays a donate button there
        requireShowCount: 4,
        requireDismiss: 1,
        maximumDismiss: 2,
        requiredTriggers: 50,
        maximumInContest: {
            "options": 1
        },
        randomizeDisplay: 0.4,
        text: "tipDonate",
        actionButton: {
            text: "tipDonateButton",
            action: "https://liberapay.com/rugk/"
        }
    },
    {
        id: "qrCodeHotkey",
        requireShowCount: 3,
        maximumDismiss: 1,
        requiredTriggers: 2,
        randomizeDisplay: false,
        text: "tipQrCodeHotkey",
    }
].forEach((object) => Object.freeze(object)));
