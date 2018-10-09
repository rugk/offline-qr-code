/**
 * Starter module for addon settings site.
 *
 * @module qrcode
 * @requires modules/OptionHandler
 */
"use strict";

import * as Logger from "/common/modules/Logger.js";
import {tips} from "/common/modules/data/tips.js";
import * as RandomTips from "/common/modules/RandomTips.js";

import * as CustomOptionTriggers from "./modules/CustomOptionTriggers.js";
import * as OptionHandler from "./modules/OptionHandler.js";

// init module
CustomOptionTriggers.registerTrigger();
OptionHandler.init();
RandomTips.init(tips).then(() => {
    RandomTips.setContext("options");
    RandomTips.showRandomTipIfWanted();
});

Logger.logInfo("Options.js finished.");
