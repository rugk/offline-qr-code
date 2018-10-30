import * as Logger from "./Logger.js";

const browserInfo = browser.runtime.getBrowserInfo();

/**
 * Creates a context menu item
 * 
 * @function
 * @param {string} title 
 * @param {Object} properties 
 * @param {function} onCreated 
 * @returns {Promise}
 */
export async function createMenu(title, properties, onCreated) {
    const info = await browserInfo;
    const version = parseInt(info.version, 10);
    if (version > 63) {
        title += "AccessKey";
    }
    
    properties.title = browser.i18n.getMessage(title);
    return browser.menus.create(properties, onCreated);

}

Logger.logInfo("ContextMenu module loaded.");