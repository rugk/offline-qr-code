# Offline QR code generator

This is a (Firefox) Web Extension, which makes it possible to generate a QR code from any website.

In contrast to many other add-ons, which use Google Web APIs for that, this add-on works completely offline.
Effectively, the add-on [prevents any web connection](src/manifest.json#L25) for itself, so it does never contact the web. Thanks to the linked `manifest.json` you can also easily verify, that this claim is true. It works offline! Always.

It is inspired by [the old Offline QR code generator add-on](https://github.com/catholicon/OfflineQR) for Firefox 56 and lower. This extension only works with Firefox Quantum (Firefox 57) and higher.

## Design goals
* Put privacy first! Privacy should be the default, so it is generating QR codes offline.
* Follow [Firefox Photon Design](https://design.firefox.com/photon/welcome.html).
* Create a simple, but intuitively usable User Interface.
* Use an up-to-date, great, customizable [QR code library](https://larsjung.de/kjua/).
* Let the user choose the size of the QR code and customize things.
* Complete internationalization (i18n).
* Complete Unicode/UTF-8/Emoji support.
* Looks good on desktop and mobile devices, i.e. it is responsive!
