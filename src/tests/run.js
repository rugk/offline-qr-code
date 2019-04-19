import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */

/* tests */
import "./dataTest/globalConsts.test.js";
import "./dataTest/messageLevel.test.js";
import "/common/modules/RandomTips/tests/dataTest/tips.test.js";
import "/common/modules/AddonSettings/tests/dataTest/defaultSettings.test.js";
import "./colors.test.js";
import "./iconHandler.test.js";

mocha.checkLeaks();
mocha.run();
