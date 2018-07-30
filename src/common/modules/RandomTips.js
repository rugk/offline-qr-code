// lodash
import debounce from "/common/modules/lib/lodash/debounce.js";

import * as Logger from "/common/modules/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";
import * as MessageHandler from "/common/modules/MessageHandler.js";

const TIP_SETTING_STORAGE_ID = "randomTips";
const GLOBAL_RANDOMIZE = 0.2; // (%)
const DEBOUNCE_SAVING = 1000; // ms

const elMessageBox = document.getElementById("messageTips");

/**
 * The list of all tips.
 *
 * Format:
 * {
 *     id {string} – just some ID
 *     maxShowCount {integer} – shows the message at most x times
 *     maximumDismiss {integer|null} – (optional) hides the message, if it
 *          has been dismissed x times.
 *     allowDismiss {bool} – optional, Set to false to disallow dismissing
 *          the message. This likely makes no sense for any tip, so the
 *          default is true.
 *     requireDismiss {bool|integer} – optional, require that message is
 *          dismissed to count as a maxShowCount. True enables this,
 *          with any integer you can specify a lower value to only require
 *          x dismisses.
 *     requiredTriggers {integer} – optional, require some displays
 *          ("triggers") of shows of tip ebfore showing tip. This is
 *          effectively just a minimum limit, so it is not shown too "early",
 *          default: 10
 *     showInContext {Object<id: bool>} – optional, a key-value object with
 *          context -> num to require the tip to be shown in a specific
 *          context for the given number of times.
 *     maximumInContest {{Object<id: bool>} – optional, a key-value object with
 *          context -> num to only show the tip in a specific context at
 *          most for the given number of times.
 *     randomizeDisplay {bool|integer} – optional, Randomizes the display
 *          with a chance of 50% by default (when "true" is set). You can
 *          override that percentage (as an integer, e.g. 0.2 instead of 20%).
 *          Note that the tip message display in general is already randomized
 *          with a chance of 20%, see {@link GLOBAL_RANDOMIZE}.
 *     text {string}: The text to actually show. It is passed to the
 *          {@link MessageHandler}, so you can (& should) use a translatable
 *          string here.
 *     actionButton {Object} – optional, adds an action button to the message
 * }
 *
 * @type {Object[]}
 */
const tips = [
    {
        id: "likeAddon",
        maxShowCount: 3,
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
        maxShowCount: 5,
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
        maxShowCount: 4,
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
        maxShowCount: 3,
        maximumDismiss: 1,
        requiredTriggers: 2,
        randomizeDisplay: false,
        text: "tipQrCodeHotkey",
    }
];

let tipConfig = {
    tips: {}
};

let tipShown = null;
let context = null;

/**
 * Save the current config.
 *
 * @function
 * @name saveConfig
 * @private
 * @returns {void}
 */
const saveConfig = debounce(() => {
    AddonSettings.set(TIP_SETTING_STORAGE_ID, tipConfig);
}, DEBOUNCE_SAVING);

/**
 * Hook for the dismiss event.
 *
 * @function
 * @private
 * @param  {Object} param
 * @returns {void}
 */
function messageDismissed(param) {
    const elMessage = param.elMessage;

    // ignore other dismissed messages
    if (elMessage !== elMessageBox) {
        return;
    }

    const id = elMessageBox.dataset.tipId;
    if (tipShown.id !== id) {
        throw new Error("cached tip and dismissed tip differ");
    }

    // update config
    tipConfig.tips[id].dismissedCount = (tipConfig.tips[id].dismissedCount || 0) + 1;
    saveConfig();

    // remove dismiss hook
    MessageHandler.setDismissHooks(null);

    // cleanup values
    tipShown = null;
    delete elMessageBox.dataset.tipId;

    Logger.logInfo(`Tip ${id} has been dismissed.`);
}

/**
 * Returns true or false at random. The passed procentage indicates how
 * much of the calls should return "true" on average.
 *
 * @function
 * @private
 * @param  {number} percentage
 * @returns {bool}
 */
function randomizePassed(percentage) {
    return (Math.random() < percentage);
}

/**
 * Shows this tip.
 *
 * @function
 * @private
 * @param  {Object} tipSpec
 * @returns {void}
 */
function showTip(tipSpec) {
    // default settings
    tipSpec.allowDismiss = tipSpec.allowDismiss !== undefined ? tipSpec.allowDismiss : true;

    elMessageBox.dataset.tipId = tipSpec.id;
    MessageHandler.showMessage(elMessageBox, tipSpec.text, tipSpec.allowDismiss, tipSpec.actionButton);

    // hook dismiss
    MessageHandler.setDismissHooks(messageDismissed);

    // update config
    tipConfig.tips[tipSpec.id].shownCount = (tipConfig.tips[tipSpec.id].shownCount || 0) + 1;
    tipConfig.tips[tipSpec.id].shownContext[context] = (tipConfig.tips[tipSpec.id].shownContext[context] || 0) + 1;
    saveConfig();

    tipShown = tipSpec;
}

/**
 * Returns whether the tip has already be shown enough times or may not
 * be shown, because of some other requirement.
 *
 * @function
 * @private
 * @param  {Object} tipSpec
 * @returns {bool}
 */
function shouldBeShown(tipSpec) {
    // default settings
    tipSpec.requiredTriggers = tipSpec.requiredTriggers !== undefined ? tipSpec.requiredTriggers : 10;
    tipSpec.maxShowCount = tipSpec.maxShowCount !== undefined ? tipSpec.maxShowCount : 0;

    // create option if needed
    if (tipConfig.tips[tipSpec.id] === undefined) {
        tipConfig.tips[tipSpec.id] = {};
        tipConfig.tips[tipSpec.id].shownContext = {};
        saveConfig();
    }

    // require some global triggers, if needed
    if (tipConfig.triggeredOpen < tipSpec.requiredTriggers) {
        return false;
    }
    // require some additional randomness if needed
    if (tipSpec.randomizeDisplay) {
        // default value for tip is 50%
        tipSpec.randomizeDisplay = tipSpec.randomizeDisplay !== true ? tipSpec.randomizeDisplay : 0.5;

        // 1 : x -> if one number is not selected, do not display result
        if (!randomizePassed(tipSpec.randomizeDisplay)) {
            return false;
        }
    }

    const tipShowCount = tipConfig.tips[tipSpec.id].shownCount || 0;
    const tipDismissed = tipConfig.tips[tipSpec.id].dismissedCount || 0;

    // do not show if it has been dismissed enough times
    if (tipSpec.maximumDismiss && tipDismissed >= tipSpec.maximumDismiss) {
        return false;
    }

    // block when it is shown too much times in a given context
    if (tipSpec.maximumInContest) {
        if (context in tipSpec.maximumInContest) {
            const tipShownInCurrentContext = tipConfig.tips[tipSpec.id].shownContext[context] || 0;

            if (tipShownInCurrentContext >= tipSpec.maximumInContest[context]) {
                return false;
            }
        }
    }

    // NOTE: do not return true above this line (for obvious reasons)
    // or has it been shown enough times already?

    // dismiss is shown enough times?
    let requiredDismissCount;
    if (Number.isFinite(tipSpec.requireDismiss)) {
        requiredDismissCount = tipSpec.requireDismiss;
    } else if (tipSpec.requireDismiss === true) { // bool
        requiredDismissCount = tipSpec.maxShowCount;
    } else {
        requiredDismissCount = 0;
    }

    // check context check if needed
    if (tipSpec.showInContext) {
        if (context in tipSpec.showInContext) {
            const tipShownInCurrentContext = tipConfig.tips[tipSpec.id].shownContext[context] || 0;

            if (tipShownInCurrentContext < tipSpec.showInContext[context]) {
                return true;
            }
        }
    }

    return tipShowCount < tipSpec.maxShowCount // not already shown enough times already?
        || tipDismissed < requiredDismissCount; // not dismissed enough times?
}

/**
 * Sets the context for the current session.
 *
 * @function
 * @param {string} string
 * @returns {void}
 */
export function setContext(string) {
    context = string;
}

/**
 * Selects and shows a random tip.
 *
 * @function
 * @returns {void}
 */
export function showRandomTip() {
    // only try to select tip, if one is even available
    if (tips.length === 0) {
        Logger.logInfo("no tips to show available anymore");
        return;
    }

    // randomly select element
    const randomNumber = Math.floor(Math.random() * tips.length);
    const tipSpec = tips[randomNumber];

    if (!shouldBeShown(tipSpec)) {
        // remove tip
        tips.splice(randomNumber, 1);

        // retry random selection
        showRandomTip();
        return;
    }

    Logger.logInfo("selected tip to be shown:", randomNumber, tipSpec);

    showTip(tipSpec);
}

/**
 * Shows the random tip only randomly so the user is not annoyed.
 *
 * @function
 * @returns {void}
 */
export function showRandomTipIfWanted() {
    tipConfig.triggeredOpen = (tipConfig.triggeredOpen || 0) + 1;
    saveConfig();

    // randomize tip showing in general
    if (!randomizePassed(GLOBAL_RANDOMIZE)) {
        Logger.logInfo("show no random tip, because randomize did not pass");
        return;
    }

    showRandomTip();
}

/**
 * Initialises the module.
 *
 * @function
 * @returns {Promise}
 */
export function init() {
    return AddonSettings.get(TIP_SETTING_STORAGE_ID).then((randomTips) => {
        tipConfig = randomTips;
    });
}

Logger.logInfo("RandomTips module loaded.");
