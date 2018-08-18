"use strict";

import {tips} from "/common/modules/config/tips.js";
import * as RandomTips from "/common/modules/RandomTips.js";

import "./modules/InitQrCode.js";

RandomTips.init(tips).then(() => {
    RandomTips.setContext("popup");
    RandomTips.showRandomTipIfWanted();
});
