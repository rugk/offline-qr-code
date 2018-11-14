"use strict";

import * as Logger from "/common/modules/Logger/Logger.js";

import * as IconHandler from "/common/modules/IconHandler.js";
import * as ContextMenu from "./modules/ContextMenu.js";
import "./modules/ReceivePopupMessages.js";

// init modules
IconHandler.init();
ContextMenu.init();

Logger.logInfo("Background page: loading finished");
