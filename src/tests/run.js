import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */

/* tests */
import "./selftest.test.js";
import "./globalConsts.test.js";
import "./messageLevel.test.js";
import "./colors.test.js";
import "./iconHandler.test.js";
import "./localiser.test.js";
import "./addonSettings.test.js";
import "./logger.test.js";
import "./RandomTips.test.js";

mocha.checkLeaks();
mocha.run();
