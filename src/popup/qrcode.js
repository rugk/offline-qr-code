"use strict";

import * as Logger from "/common/modules/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";
import * as MessageHandler from "/common/modules/MessageHandler.js";
import * as RandomTips from "/common/modules/RandomTips.js";

import * as QrCreator from "./modules/QrCreator.js";
import * as BrowserCommunication from "./modules/BrowserCommunication.js";
import * as UserInterface from "./modules/UserInterface.js";

/* globals */
let initCompleted = false;

// init modules
const queryBrowserTabs = browser.tabs.query({active: true, currentWindow: true});
AddonSettings.loadOptions();
BrowserCommunication.init();
const qrCreatorInit = QrCreator.init();
const userInterfaceInit = UserInterface.init();

// check for selected text
// current tab is used by default
const getSelection = AddonSettings.get("autoGetSelectedText").then((autoGetSelectedText) => {
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
qrCreatorInit.then(() => {
    userInterfaceInit.then(() => {
        // do not generate tabs if text is already overwritten
        if (BrowserCommunication.isTextOverwritten()) {
            Logger.logInfo("Text is already overwritten by some message.");
            // generate QR code
            QrCreator.generate();

            UserInterface.lateInit();
        } else {
            // get text from selected text, if possible
            let setInitialQrCode = getSelection.then((selection) => {
                QrCreator.setText(selection);
                QrCreator.generate();
            }).catch(() => {
                // …or fallback to tab URL
                setInitialQrCode = queryBrowserTabs.then(QrCreator.generateFromTabs).catch((error) => {
                    Logger.logError(error);
                    MessageHandler.showError("couldNotReceiveActiveTab", false);
                });
            });

            setInitialQrCode.then(UserInterface.lateInit);
        }

        // hide loading message shown by default
        MessageHandler.hideLoading();

        initCompleted = true;
    });
}).catch(Logger.logError);

RandomTips.init().then(() => {
    RandomTips.setContext("popup");
    RandomTips.showRandomTipIfWanted();
});
