const runtimeConfig = {
    shouldUseSelectedText: false
};

const ContextMenuHandler = (function () {
    const me = {};

    const CONVERT_TEXT_SELECTION = "convert-text-selection";
    const OPEN_OPTIONS = "open-options";

    /**
     * Creates the items in the context menu
     *
     * @name   ContextMenuHandler.createItems
     * @function
     * @returns {void}
     */
    function createItems() {
        browser.contextMenus.create({
            id: CONVERT_TEXT_SELECTION,
            title: browser.i18n.getMessage("contextMenuItemConvertSelection"),
            contexts: ["selection"]
        });

        browser.contextMenus.create({
            id: OPEN_OPTIONS,
            title: browser.i18n.getMessage("contextMenuItemOpenOptions"),
            contexts: ["browser_action"]
        });
    }

    /**
     * Set a new listener to respond to user interactions
     *
     * @name   ContextMenuHandler.setClickListener
     * @function
     * @returns {void}
     */
    function setClickListener() {
        browser.contextMenus.onClicked.addListener((info) => {
            switch (info.menuItemId) {
            case CONVERT_TEXT_SELECTION:
                runtimeConfig.shouldUseSelectedText = true;
                browser.browserAction.openPopup();
                break;
            case OPEN_OPTIONS:
                browser.runtime.openOptionsPage();
                break;
            }
        });
    }

    /**
     * Init context menu module.
     *
     * @name   ContextMenuHandler.init
     * @function
     * @returns {void}
     */
    me.init = function() {
        createItems();
        setClickListener();
    };

    return me;
})();

const MessageListener = (function () {
    const me = {};

    /**
     * get one or more variables and send them back to the requested source
     *
     * @name   MessageListener.get
     * @function
     * @param {array} request
     * @returns {Object}
     */
    function get(request) {
        const response = {};
        for (let i = 0; i < request.length; i++) {
            const name = request[i];
            const option = runtimeConfig[name];
            if (option) {
                response[name] = option;
            }
        }
        return response;
    }

    /**
      * set one or more variables from another script
      *
      * @name   MessageListener.set
      * @function
      * @param {array} request
      * @returns {void}
      */
    function set(request) {
        for (const key in request) {
            if (request.hasOwnProperty(key)) {
                runtimeConfig[key] = request[key];
            }
        }
    }

    /**
     * Init message handler module.
     *
     * @name   MessageListener.init
     * @function
     * @returns {void}
     */
    me.init = function() {
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.get) {
                const response = get(request.get);
                sendResponse({response});
            } else if (request.set) {
                set(request.set);
            }
        });
    };

    return me;
})();


ContextMenuHandler.init();
MessageListener.init();
