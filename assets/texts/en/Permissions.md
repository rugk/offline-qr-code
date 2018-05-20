# Requested permissions

For a general explanation of add-on permission see [this support article](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Main permissions

These permissions are requested at the installation or when updating.

| Internal Id | Permission                                                        | Explanation                                                                                                                                           |
|:------------|:------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloads` | Download files and read and modify the browser’s download history | Needed for downloading (saving) the SVG image. This add-on does not access your downloaded files, it just uses this permission to start the download. |

## Hidden permissions
Additionally it requests these permission, which are not requested in Firefox when the add-on is installed, as they are not a serious permission.

| Internal Id | Permission                   | Explanation                                                       |
|:------------|:-----------------------------|:------------------------------------------------------------------|
| `activeTab` | Access current tab website   | Needed for getting the URL of the current website for the QR code |
| `storage`   | Access local storage         | Needed for saving options                                         |
| `menus`     | Modify browser context menus | Needed for adding context menus "QR code from selection" (etc.)   |
