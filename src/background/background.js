"use strict";

import * as Logger from "/common/modules/Logger.js";

import * as IconHandler from "./modules/IconHandler.js";
import * as ContextMenu from "./modules/ContextMenu.js";
import * as BrowserCommunication from "./modules/BrowserCommunication.js";

// init modules
IconHandler.init();
ContextMenu.init();
BrowserCommunication.init();

Logger.logInfo("Background page: loading finished");
