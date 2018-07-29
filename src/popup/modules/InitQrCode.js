import * as Logger from "/common/modules/Logger.js";
import * as AddonSettings from "/common/modules/AddonSettings.js";
import * as MessageHandler from "/common/modules/MessageHandler.js";

import * as QrCreator from "./QrCreator.js";
import * as BrowserCommunication from "./BrowserCommunication.js";
import * as UserInterface from "./UserInterface.js";

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
        return getCurrentTab().then(QrCreator.generateFromTab).catch(error => {
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

let requestedTabId = null;

/**
 * Gets the current tab
 *
 * @returns {Promise}
 */
async function queryActiveTab() {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});

    const tab = tabs[0];
    requestedTabId = tab.id;

    if (tab.url === undefined) {
        throw new Error("no tab URL defined");
    }

    return tab;
}

/**
 * Returns a successful promise, if the tab has been loaded.
 *
 * @param {int} requestedTabId
 * @param {int} timeout default=5000; in ms
 * @returns {Promise}
 */
function IsLoadingEnd(requestedTabId, timeout = 5000) {
    let waitHandler;
    console.log(requestedTabId);

    return new Promise((resolve, reject) => {
        waitHandler = (tabId, changeInfo, tab) => {
            console.log(tabId, changeInfo, tab);
            if (tab.status !== "complete" || tabId !== requestedTabId) {
                // ignore, as we wait for the "correct" event
                return;
            }

            console.log("IS COMPLETE");
            resolve();
        }

        browser.tabs.onUpdated.addListener(waitHandler);

        setTimeout(() => {
            reject(new Error("timeout"));
        }, timeout);
    }).finally(() => {
        browser.tabs.onUpdated.removeListener(waitHandler);
    });
}

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log("TEST")
    const activeTab = await browser.tabs.query({active: true, currentWindow: true});
    console.log(activeTab)

    setTimeout()
});


/**
 * Gets the current tab
 *
 * @returns {Promise}
 */
function getCurrentTab() {
    //let waitForActiveCompleted;



      const bindOnUpdatedListenerY = new Promise((resolve, reject) => {
          /**
           * Gets the current tab
           *
           * @param {int} tabId
           * @param {Object} changeInfo
           * @param {tabs.Tab} tab
           * @returns {Promise}
           */
          waitForActiveCompleted = function(tabId, changeInfo, tab) {
              console.log(tabId, changeInfo, tab)
              if (tab.status !== "complete" || (requestedTabId !== null && tabId !== requestedTabId)) {
                  // ignore, as we wait for the "correct" event
                  return;
              }
              console.log("process")

              queryActiveTab().then(tab => {
                  // If requestedTabId was not yet set, set it
                  if (requestedTabId === null) {
                      requestedTabId = tab.id;

                      // if it does equal the event, ignore it (same behaviour the syncronous check as above)
                      if (requestedTabId !== tabId) {
                          return;
                      }
                  }

                  // resolve, if we found the data of the active tab
                  console.log("OK", tab)
                  resolve(tab);
              }).catch((error) => {
                  console.log(new Error("onUpdated: " + error.message));
              });
          };

          browser.tabs.onUpdated.addListener(waitForActiveCompleted);
      });

    const bindOnUpdatedListenerX = async () => {
        // only to get ID
        const activeTab = await browser.tabs.query({active: true, currentWindow: true});
        await IsLoadingEnd(activeTab[0].id);

        // re-query tab
        return queryActiveTab();
    };
    const bindOnUpdatedListener = bindOnUpdatedListenerX();

    const firstActiveTabQuery = queryActiveTab();
    return Promise.race([firstActiveTabQuery, bindOnUpdatedListener]).catch(() => {
        // in case of error, ensure that both promises ran and only if both errored, error
        return firstActiveTabQuery.catch(() => {
            return bindOnUpdatedListener;
        });
    }).finally(() => {
        //browser.tabs.onUpdated.removeListener(waitForActiveCompleted);
    });
}
