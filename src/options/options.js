/**
 * Starter module for addon settings site.
 *
 * @module qrcode
 * @requires modules/OptionHandler
 */

import * as RandomTips from "/common/modules/RandomTips/RandomTips.js";
import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as AutomaticSettings from "/common/modules/AutomaticSettings/AutomaticSettings.js";

import * as CustomOptionTriggers from "./modules/CustomOptionTriggers.js";

// init module
CustomOptionTriggers.registerTrigger();
AutomaticSettings.setDefaultOptionProvider(AddonSettings.getDefaultValue);
AutomaticSettings.init();
RandomTips.init().then(() => {
    RandomTips.setContext("options");
    RandomTips.showRandomTipIfWanted();
});
