/**
 * Starter module for QR code popup.
 *
 * @module qrcode
 * @requires modules/RandomTips
 * @requires modules/InitQrCode
 */
"use strict";

import { tips } from "/common/modules/data/Tips.js";
import * as RandomTips from "/common/modules/RandomTips/RandomTips.js";

import "./modules/InitQrCode.js";

const CHECKBOX_ID = "disable-tips-checkbox";

/*Check browser's storage if user wants to receive the tips*/
async function ShowTips() {
    const result = await browser.storage.local.get("showTips");
    return result.showTips !== false;
}

/*Functionality for checkbox changes */
function SetupCheckbox() {
    const checkbox = document.getElementById(CHECKBOX_ID);
    if (!checkbox) return;

    /*Load initial state whether users wants to see tips */
    browser.storage.local.get("showTips").then((result) => {
        checkbox.checked = result.showTips === false;
    });

    checkbox.addEventListener("change", () => {
        const show = !checkbox.checked;
        browser.storage.local.set({ showTips: show });
    });
}

async function init() 
{
    SetupCheckbox();
    if (await ShowTips()) 
    {
        RandomTips.init(tips).then(() => {
            RandomTips.setContext("popup");
            RandomTips.showRandomTipIfWanted();
        });
    }
}

init();