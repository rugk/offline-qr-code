"use strict";

import * as Logger from "/common/modules/Logger.js";
import * as RandomTips from "/common/modules/RandomTips.js";

import * as OptionHandler from "./modules/OptionHandler.js";

// init module
OptionHandler.init();
RandomTips.init().then(() => {
    RandomTips.setContext("options");
    RandomTips.showRandomTipIfWanted();
});

Logger.logInfo("Options.js finished.");
