import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */

/* tests */
import "./selftest.test.js";
import "./globalConsts.test.js";
import "./colors.test.js";
import "./iconHandler.test.js";
import "./localiser.test.js";
import "./addonSettings.test.js";

mocha.checkLeaks();
mocha.run();
