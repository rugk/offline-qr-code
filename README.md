# Offline QR Code Generator <img align="right" height="425" width="365" src="assets/screencasts/qrText.gif">

[![Mozilla Add-on version](https://img.shields.io/amo/v/offline-qr-code-generator.svg)](https://addons.mozilla.org/de/firefox/addon/offline-qr-code-generator/?src=external-github-shield-downloads)  
[![Mozilla Add-on downloads](https://img.shields.io/amo/d/offline-qr-code-generator.svg)](https://addons.mozilla.org/de/firefox/addon/offline-qr-code-generator/?src=external-github-shield-downloads)
[![Mozilla Add-on users](https://img.shields.io/amo/users/offline-qr-code-generator.svg)](https://addons.mozilla.org/de/firefox/addon/offline-qr-code-generator/statistics/)
[![Mozilla Add-on stars](https://img.shields.io/amo/stars/offline-qr-code-generator.svg)](https://addons.mozilla.org/de/firefox/addon/offline-qr-code-generator/reviews/)

<img height="200" width="200" src="assets/qrbig-optimized.svg">

This is a (Firefox) add-on (WebExtension) allowing you to generate a QR code from any website and any text.

In contrast to many other add-ons, which use Google Web APIs for that, this add-on works completely offline. **This QR code generator puts your privacy first!** It does this by working _offline_, independently of any internet connection! Always.

It has a radically **simple, yet powerful** interface, allowing you to tweak many things in the settings, but being lightweight when you use it. It's really easy to use! For instance, you can **just resize the QR code** with your mouse via dragging and dropping. Its **lightweight** size also make it fast and easy to install – even on mobile connections.

It is inspired by [the old Offline QR code generator add-on](https://github.com/catholicon/OfflineQR) for Firefox 56 and lower. This extension only works with modern Firefox versions.

## Download

**[![Get it for Firefox!](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png)](https://addons.mozilla.org/firefox/addon/offline-qr-code-generator/?src=external-github-download)**

## In action…

![showing resizing](assets/screencasts/qrResize.gif)

See:
* [More screencasts](assets/screencasts)
* [More screenshots](assets/screenshots)
* [Lightning Talk](https://media.ccc.de/v/35c3-9566-lightning_talks_day_2#t=6331) 2018-12-29 at 35th Chaos Communication Congress, Leipzig ([slides](https://github.com/rugk/offline-qr-code-35c3))

## Features
* Puts your privacy first! Privacy is the default here, so it is generating QR codes offline.
* Follows [Firefox Photon Design](https://design.firefox.com/photon/welcome.html).
* Has a simple, but intuitive and usable User Interface.
* Uses up-to-date, great and customizable [QR code](https://github.com/nayuki/QR-Code-generator) [libraries](https://larsjung.de/kjua/).
* You can generate and save QR codes as SVG or Canvas (PNG image)!
* You can choose the size of the QR code and customize things.
* Is completely internationalized (i18n).
* You can use a shortcut (Ctrl+Shift+F10) for generating the QR code.
* Generates QR codes from selected text on the website.
* Has complete Unicode/UTF-8/Emoji support.
* Looks good on desktop and mobile devices, i.e. it is responsive!
* Translated in English and German already. [Contribute your own language!](CONTRIBUTING.md#Translations)
* Compatible with Firefox for Android
* Uses up-to-date features and APIs of Firefox for efficient and clean code.
* Settings are synced across devices.
* Settings can be managed by your administrator. (work in progress)

## Notes

”QR Code” is a registered trademark of DENSO WAVE.
