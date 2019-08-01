const browserInfo = browser.runtime.getBrowserInfo();

/**
 * Creates a context menu item.
 *
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/menus/create}
 * @public
 * @param {string} title
 * @param {Object} properties
 * @returns {Promise}
 */
export function createMenu(title, properties) {
    return new Promise(async (resolve, reject) => {
        // ignore if menu API is not supported (on Android e.g.)
        if (browser.menus === undefined) {
            reject(new Error("context menu feature is not supported"));
        }

        const info = await browserInfo;
        const version = parseInt(info.version, 10);
        if (version > 63) {
            properties.title = browser.i18n.getMessage(`${title}AccessKey`);
        }

        if (!("title" in properties) || !properties.title) {
            properties.title = browser.i18n.getMessage(title);
        }

        // create menu and log errors
        const newId = browser.menus.create(properties, () => {
            const lastError = browser.runtime.lastError;

            if (lastError) {
                console.log(`error creating menu item: ${lastError}`);
                reject(lastError);
            } else {
                console.log("menu item created successfully");
                resolve(newId);
            }
        });

        return Promise.resolve();
    });
}
