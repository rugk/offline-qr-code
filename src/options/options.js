"use strict";

import * as AddonSettings from "/common/modules/AddonSettings.js";
import * as RandomTips from "/common/modules/RandomTips.js";

import * as OptionHandler from "./modules/OptionHandler.js";

// init module
AddonSettings.loadOptions();
OptionHandler.init();
RandomTips.init().then(() => {
    RandomTips.setContext("options");
    RandomTips.showRandomTipIfWanted();
});
