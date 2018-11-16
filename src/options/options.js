/**
 * Starter module for addon settings site.
 *
 * @module qrcode
 * @requires modules/OptionHandler
 */
"use strict";

import * as Logger from "/common/modules/Logger/Logger.js";
import { tips } from "/common/modules/data/Tips.js";
import * as RandomTips from "/common/modules/RandomTips/RandomTips.js";
import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

import * as CustomOptionTriggers from "./modules/CustomOptionTriggers.js";
import * as AutomaticSettings from "./modules/AutomaticSettings/AutomaticSettings.js";

// init module
CustomOptionTriggers.registerTrigger();
AutomaticSettings.setDefaultOptionProvider(AddonSettings.getDefaultValue);
AutomaticSettings.init();
RandomTips.init(tips).then(() => {
    RandomTips.setContext("options");
    RandomTips.showRandomTipIfWanted();
});

Logger.logInfo("Options.js finished.");
