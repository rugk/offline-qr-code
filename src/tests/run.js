import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */

/* tests */
import "./selftest.test.js";
import "./colors.test.js";
import "./localizer.test.js";

mocha.checkLeaks();
mocha.run();
