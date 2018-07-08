"use strict";

import * as RandomTips from "/common/modules/RandomTips.js";

import "./modules/InitQrCode.js";

RandomTips.init().then(() => {
    RandomTips.setContext("popup");
    RandomTips.showRandomTipIfWanted();
});
