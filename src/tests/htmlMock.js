const TEST_AREA_ID = "testArea";

const elTestArea = document.getElementById(TEST_AREA_ID)

export function setTestHtmlFile(filename) {
    return fetch(`./` + filename).then((response) => {
        console.log(response);
        if (!response.ok) {
            throw new Error("Error in network response when fetching " + filename + ".");
        }

        return response.text();
    }).then((responseBlob) => {
        return setTestHtml(responseBlob);
    });
}

export function setTestHtml(htmlText) {
    elTestArea.innerHTML = htmlText;
}
