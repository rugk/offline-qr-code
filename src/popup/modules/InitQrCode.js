import * as Logger from "/common/modules/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";
import * as MessageHandler from "/common/modules/MessageHandler.js";

import * as QrCreator from "./QrCreator.js";
import * as BrowserCommunication from "./BrowserCommunication.js";
import * as UserInterface from "./UserInterface.js";
import { retryPromise } from "/common/modules/HelperFunctions.js";

/* globals */
export let initCompleted = false;

// init modules
AddonSettings.loadOptions();
BrowserCommunication.init();
const qrCreatorInit = QrCreator.init().then(() => {
    Logger.logInfo("QrCreator module loaded.");
});
const userInterfaceInit = UserInterface.init().then(() => {
    Logger.logInfo("UserInterface module loaded.");
});

// check for selected text
// current tab is used by default
const gettingSelection = AddonSettings.get("autoGetSelectedText").then((autoGetSelectedText) => {
    if (autoGetSelectedText !== true) {
        throw new Error("using selection is disabled");
    }

    return browser.tabs.executeScript({
        code: "window.getSelection().toString();",
        allFrames: true // TODO: does not work currently, https://discourse.mozilla.org/t/activetab-permission-does-not-include-iframes-in-current-tab/29084
    }).then((injectResults) => {
        let selection;
        // iterate through results and find selection (if there are multiple ones)
        do {
            selection = injectResults.pop();
        } while (selection === "");

        // throw error if there is still nothing selected (or everything was popped, so it is undefined)
        if (!selection) {
            throw new Error("nothing selected");
        }

        return selection;
    });
});

// generate QR code from tab or selected text or message, if everything is set up
export const initiationProcess = Promise.all([qrCreatorInit, userInterfaceInit]).then(() => {
    // do not generate tabs if text is already overwritten
    if (BrowserCommunication.isTextOverwritten()) {
        Logger.logInfo("Text is already overwritten by some message.");
        // generate QR code
        QrCreator.generate();

        UserInterface.lateInit();

        return Promise.resolve();
    }

    // get text from selected text, if possible
    return gettingSelection.then((selection) => {
        QrCreator.setText(selection);
        QrCreator.generate();
    }).catch(() => {
        getTabWithValidUrl().then(QrCreator.generateFromTab).catch(error => {
            Logger.logError(error);
            MessageHandler.showError("couldNotReceiveActiveTab", false);

            // re-throw error
            throw error;
        });
    });
}).finally(() => {
    // post-initiation code should still run, even if errors happen
    UserInterface.lateInit();

    // hide loading message shown by default
    MessageHandler.hideLoading();

    // init is done, set variable to syncronously get values
    initCompleted = true;
}).catch((error) => {
    Logger.logError(error);
});

/**
 * Queries Tabs API for 20 times with a delay of 300ms until the tabs have a defined url.
 * Will reject if url is not defined.
 *
 * @returns {Promise}
 */
function getTabWithValidUrl() {
    const delay = 300;
    const maxRetries = 20;

    return retryPromise(async () => {
        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        const tab = tabs[0];

        if (tab && tab.url) {
            return tab;
        } else {
            throw new Error("Url not found.");
        }
    }, delay, maxRetries);
}
