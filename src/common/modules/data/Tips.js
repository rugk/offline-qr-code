/**
 * The settings/constraints for a tip, represented in an object.
 *
 * @typedef {Object} TipObject
 * @property {string} id just some ID
 * @property {integer|null} requiredShowCount shows the message x times; set
 * to "null" to show infinitively
 * @property {bool} [allowDismiss=true] set to false to disallow dismissing
 * the message. This likely makes no sense for any tip, so the default is true.
 * @property {bool|integer} [requireDismiss=false] show the message, if it is
 * not, at least, dismissed for x times. Alternatively set to true to require
 * that message is dismissed the exact same number as requiredShowCount states,
 * i.e. only dismissed count as "tip shown".
 * @property {integer|null} [maximumDismiss=null] hides the message, if it
 * has been dismissed x times.
 * @property {integer} [requiredTriggers=10] require some displays ("triggers")
 * of (any) add-on page before showing tip. This is effectively just a minimum
 * limit, so it is not shown too "early".
 * @property {Object.<string: integer>} [showInContext] a key-value object with
 * context -> num to require the tip to be shown in a specific context for the
 * given number of times. See {@link RandomTips.setContext}.
 * @property {Object.<string: integer>} [maximumInContest] a key-value object with
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

import {isMobile} from "../MobileHelper.js";
import {userSpeaksLocaleNotYetTranslated} from "../LanguageHelper.js";

/**
 * An array of all tips.
 *
 * @private
 * @const
 * @type {Array.<TipObject>}
 */
const tipArray = [
    {
        id: "likeAddon",
        requiredShowCount: 3,
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
        requiredShowCount: 5,
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
            action: "tipSaveQrCodeLink"
        }
    },
    // {
    //     id: "donate",
    //     requiredShowCount: 4,
    //     requireDismiss: 1,
    //     maximumDismiss: 2,
    //     requiredTriggers: 50,
    //     // do not show on options page as Firefox already displays a donate button there
    //     maximumInContest: {
    //         "options": 0
    //     },
    //     randomizeDisplay: 0.4,
    //     text: "tipDonate",
    //     actionButton: {
    //         text: "tipDonateButton",
    //         action: "https://liberapay.com/rugk/"
    //     }
    // },
    {
        id: "qrCodeHotkey",
        requiredShowCount: 3,
        maximumDismiss: 1,
        requiredTriggers: 2,
        randomizeDisplay: false,
        text: "tipQrCodeHotkey",
        showTip: async () => {
            // do not show if user is on Android
            if (await isMobile()) {
                return false;
            }

            // find command
            const allCommands = await browser.commands.getAll();
            const popupOpenCommand = allCommands.find((command) => command.name === "_execute_browser_action");

            // if shortcut is modified, do not show tip
            if (popupOpenCommand.shortcut !== "Ctrl+Shift+F10") {
                return false;
            }

            return null; // continue as normal
        }
    },
    {
        id: "androidQrReader",
        requiredShowCount: 3,
        maximumDismiss: 1,
        requiredTriggers: 6,
        randomizeDisplay: false,
        text: "tipAndroidQrReader",
        actionButton: {
            text: "tipHowToUse",
            action: "tipAndroidQrReaderLink"
        },
        showTip: async () => {
            // only not show if user is on Android
            if (!(await isMobile())) {
                return false;
            }

            return null; // continue as normal
        }
    },
    {
        id: "translateAddon",
        requiredShowCount: 5,
        maximumDismiss: 1,
        requiredTriggers: 10,
        randomizeDisplay: false,
        text: "tipTranslateAddon",
        actionButton: {
            text: "tipLearnMore",
            action: "tipTranslateAddonLink"
        },
        showTip: async (tipSpec) => {
            // do not show tip if add-on is already translated into a locale the
            // user speaks
            if (!(await userSpeaksLocaleNotYetTranslated())) {
                // Instead of returning false, we "just" make it unlikely that
                // the tip is shown.
                // This means we can be sure the tip is shown anyway to some
                // users, who may speak a language we already have the add-on
                // translated into it, as they can still improve translations etc.
                tipSpec.randomizeDisplay = 0.10; // 10%

                return null;
            }

            return null; // continue as normal
        }
    }
];

// freeze it all, this is strongly recommend
tipArray.forEach((object) => Object.freeze(object));

/**
 * The list of all tips. (now exported)
 *
 * @public
 * @const
 * @type {Array.<TipObject>}
 */
export const tips = Object.freeze(tipArray);
