const TEST_AREA_ID = "testArea";

const elTestArea = document.getElementById(TEST_AREA_ID);

/**
 * Downloads the test file and attach it to the test area.
 *
 * @function
 * @private
 * @param  {string} filename
 * @returns {void}
 */
export function setTestHtmlFile(filename) {
    return fetch(`./${filename}`).then((response) => {
        if (!response.ok) {
            throw new Error(`Error in network response when fetching ${filename}.`);
        }

        return response.text();
    }).then((responseBlob) => setTestHtml(responseBlob));
}

/**
 * Set the HTML code as a test code in the test area.
 *
 * @function
 * @private
 * @param  {string} htmlText
 * @returns {void}
 */
export function setTestHtml(htmlText) {
    elTestArea.innerHTML = htmlText;
}

/**
 * Removes any test HTML code.
 *
 * @function
 * @private
 * @returns {void}
 */
export function cleanup() {
    elTestArea.innerHTML = "";
}
