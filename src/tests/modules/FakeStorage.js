import isPlainObject from "/common/modules/lib/lodash/isPlainObject.js";
import isString from "/common/modules/lib/lodash/isString.js";

// NOTE: When using, remember this uses "this". So better .bind(thisObject) here.

export class FakeStorage {
    constructor() {
        this.clear();
    }

    /**
     * Saves a value in the storage.
     *
     * AttentioN: It does not use deep-cloning, so avoid passing it many (nested)
     * object references.
     *
     * @function
     * @param {Object} keys
     * @returns {Promise}
     */
    set(keys) {
        return new Promise(((resolve, reject) => {
            if (!isPlainObject(keys)) {
                reject(new Error("Incorrect argument types for FakeStorage."));
            }

            // automcatically changes target object
            Object.assign(this.internalStorage, keys);

            resolve();
        }));
    }

    /**
     * Gets the amount of storage space, in bytes.
     *
     * @function
     * @todo Still needs to be implemented!
     * @param {string|array} keys
     * @returns {Promise}
     */
    getBytesInUse() {
        return Promise.resolve(-1234);
    }

    /**
     * Deletes the item with the corresponding ID.
     *
     * @function
     * @param {string|array} keys
     * @returns {Promise}
     */
    remove(keys) {
        return new Promise((resolve, reject) => {
            if (Array.isArray(keys)) {
                for (const item of keys) {
                    if (!isString(item)) {
                        continue;
                    }

                    delete this.internalStorage[item];
                }
                resolve();
                return;
            }

            if (!isString(keys)) {
                reject(new Error("Incorrect argument types for FakeStorage."));
            }

            delete this.internalStorage[keys];
            resolve();
        });
    }

    /**
     * Clears storage.
     *
     * @function
     * @returns {Promise}
     */
    clear() {
        this.internalStorage = {};

        return Promise.resolve();
    }

    /**
     * Returns the element to look for in an object or returns an empty object.
     *
     * @function
     * @param {string|array|Object|null|undefined} keys
     * @returns {Promise}
     */
    get(keys) {
        return new Promise((resolve, reject) => {
            if (keys === undefined || keys === null) {
                resolve(this.internalStorage);
            }

            // function to fill one object
            const fillObjects = (returnValue, item) => {
                if (!isString(item)) {
                    reject(new Error("Error: Type error for parameter keys (Value must either: be a string value, .1 must be a string value, or be an object value) for FakeStorage."));
                }

                const value = this.internalStorage[item];
                // ignore non-existant values
                if (value === undefined) {
                    return;
                }

                returnValue[item] = this.internalStorage[item];
            };

            if (Array.isArray(keys)) {
                const returnValue = {};
                for (const item of keys) {
                    fillObjects(returnValue, item);
                }
                resolve(returnValue);
                return;
            }

            if (isPlainObject(keys)) {
                const returnValue = keys;
                for (const key of Object.keys(test)) {
                    fillObjects(returnValue, key);
                }
                resolve(returnValue);
                return;
            }

            if (!isString(keys)) {
                reject(new Error("Incorrect argument types for FakeStorage."));
            }

            let returnValue = this.internalStorage[keys];

            // return empty object for non-existant values
            if (returnValue === undefined) {
                returnValue = {};
            } else {
                returnValue = {[keys]: returnValue};
            }
            resolve(returnValue);
        });
    }
}
