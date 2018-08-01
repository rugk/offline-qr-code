//import * as Logger from "/common/modules/Logger.js";

const DEFAULT_TIMEOUT = 10000;

/**
 * Queries the active tab from the browser.
 *
 * @returns {Promise}
 */
async function queryCurrentTab() {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    return tabs[0];
}

/**
 * Verifies whether the tab is a valid active tab, i.e. has an URL.
 *
 * @param {tabs.Tab} tab
 * @returns {boolean}
 */
function tabHasUrl(tab) {
    return tab.url !== undefined;
}

/**
 * Returns the active tab with URL.
 *
 * @param {int|null} [timeout=DEFAULT_TIMEOUT] in ms
 * @returns {Promise}
 */
export function getActiveTab(timeout = DEFAULT_TIMEOUT) {
    let waitHandler;
    let requestedTabId = null;

    const promise = new Promise(async (resolve, reject) => {
        /**
         * Gets the current tab
         *
         * @param {int} tabId
         * @returns {Promise}
         */
        waitHandler = async (tabId, a, b) => {
            console.log(tabId, a, b);
            // Logger.logInfo(tabId, a, b);
            if (tabId !== requestedTabId) {
                // ignore, as we wait for the "correct" tab
                return;
            }

            const tab = await queryCurrentTab().catch(reject);
            console.log("queryCurrentTab:", tab);
            // Logger.logInfo("queryCurrentTab:", tab);
            if (tabHasUrl(tab)) {
                resolve(tab);
            } else if (tab.status === "complete") {
                reject(new Error("Tab has no URL despite the tab having reached completed state."));
            }
        };

        // lsiten for new events
        browser.tabs.onUpdated.addListener(waitHandler);

        // setup timeout, if needed
        if (Number.isFinite(timeout)) {
            setTimeout(() => {
                reject(new Error("timeout"));
            }, timeout);
        }

        // do initial query and only continue (with event handler), if it does not already get the active tab
        const tab = await queryCurrentTab().catch(reject);
        if (tabHasUrl(tab)) {
            resolve(tab);
        } else {
            // save ID for active tab and listen to events now to find active tab
            requestedTabId = tab.id;
        }
    });

    // never forget to remove the event handler
    return promise.finally(() => {
        browser.tabs.onUpdated.removeListener(waitHandler);
    });
}
