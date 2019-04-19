const browserInfo = browser.runtime.getBrowserInfo();

/**
 * Creates a context menu item.
 *
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/menus/create}
 * @public
 * @param {string} title
 * @param {Object} properties
 * @param {function} onCreated
 * @returns {Promise}
 */
export async function createMenu(title, properties, onCreated) {
    // ignore if menu API is not supported (on Android e.g.)
    if (browser.menus === undefined) {
        return Promise.resolve();
    }

    const info = await browserInfo;
    const version = parseInt(info.version, 10);
    if (version > 63) {
        properties.title = browser.i18n.getMessage(`${title}AccessKey`);
    }

    if (!("title" in properties) || !properties.title) {
        properties.title = browser.i18n.getMessage(title);
    }

    return browser.menus.create(properties, onCreated);
}
