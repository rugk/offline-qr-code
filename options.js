'use strict';

/* globals Logger */
/* globals ADDON_NAME */
/* globals ADDON_NAME_SHORT */

var OptionHandler = (function () {
    let me = {};

    /**
     * Saves all settings.
     *
     * @name   OptionHandler.saveOptions
     * @function
     * @private
     * @param  {object} event
     */
    function saveOptions(event) {
        browser.storage.sync.set({
            colour: document.querySelector("#colour").value
        });
        event.preventDefault();
    }

    /**
     * Restores the managed options by administrators.
     *
     * @name   OptionHandler.setManagedOptions
     * @function
     * @private
     */
    function setManagedOptions() {
        // TODO: https://github.com/mdn/webextensions-examples/blob/master/favourite-colour/options.js
        var storageItem = browser.storage.managed.get('colour');
        storageItem.then((res) => {
            document.querySelector("#managed-colour").innerText = res.colour;
        });

        var gettingItem = browser.storage.sync.get('colour');
        gettingItem.then((res) => {
            document.querySelector("#colour").value = res.colour || 'Firefox red';
        });
    }

    /**
     * Localizes static strings in the HTML file.
     *
     * @name   Localizer.init
     * @function
     */
    me.init = function() {
        // TODO: select
        document.querySelectorAll("form").forEach((currentElem) => {
            currentElem.addEventListener("input", saveOptions);
        });

        document.addEventListener('DOMContentLoaded', setManagedOptions);
    };

    return me;
})();

// init module
OptionHandler.init();
