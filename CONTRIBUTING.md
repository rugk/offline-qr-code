Nice to see you want to contribute! :+1:

## Translations

It would be great if you can contribute your translations! You can either translate the JSON files directly or use [this online translator service](https://lusito.github.io/web-ext-translator/?gh=https://github.com/rugk/offline-qr-code).

**Manually:** To translate it manually, go to [`src/_locales/en`](src/_locales/en) and copy the English (or German) [`messages.json`](src/_locales/en/messages.json) file. (You could also use another source language if you want, but usually English is the best.) Create a new dir at [`src/_locales`](src/_locales) with the abbreviation of the language you want to translate.  
**Web-ext-translator:** Go to [this page](https://lusito.github.io/web-ext-translator/?gh=https://github.com/rugk/offline-qr-code) and translate it online. Download the result by clicking on "Export to ZIP" at the bottom.

At the end, just submit a Pull Request with your changed files.
Of course, you can (and should) improve existing translations.

For more details, [see the official docs](https://developer.mozilla.org/Add-ons/WebExtensions/Internationalization#Providing_localized_strings_in__locales).

### Translation style

The English "you" should be translated in a personal way, if the target language differentiates between "you" for "anybody"/"they" and "you" for "the user of this extension". In German, that e.g. means you can translate it with "du [kannst etwas machen]" instead of "man [kann etwas machen]". As you can see, please use the informal "you" ("du") instead of a formal language style, if your language differentiates between that.

Please pay attention to the context and UI area the message is used for. Better translate it to a good native statement than a literal translation.
For example messages like "Learn more" may need special (and different) handling and could also be translated with "More information" or so. Generally in the tips you should be as concise as possible. All other texts – like helper texts in the options page – should also be concise, but on point and factually correct. You may use easy terms to explain a thing and link to more resources instead, however. (See also the "Writing for users" guide linked below, where this is explained in more detail.)

Please have look at [the "Writing for users" guide](https://design.firefox.com/photon/copy/writing-for-users.html) of the Firefox Photon Design for other rules you should adhere to. The [Mozilla localization style guide](https://mozilla-l10n.github.io/styleguides/) can also help.

### Using HTML in translations

**Using HTML in translations is disabled due to security reasons.**

If you need to use HTML in a translation, please prepend `!HTML!` in front of the text. It will only be parsed as HTML if you do this. Otherwise it will be displayed as text. A sentence could look like this:
```json
"boldSentence": {
  "message": "!HTML! <b>This sentence is bold</b>"
}
```

### Translation of add-on listings

All texts shown on AMO (addons.mozilla.org) are maintained in [`assets/texts`](assets/texts). Again, you can use the English template there.
The files have different formats, but all of them are easily translatable with any text editor.
Note that the `amoScreenshots.csv` file refers to the screenshot descriptions you can see when you click on the screenshots of AMO. The first column there is the file name, which you can see in [`assets/screenshots`](assets/screenshots), and _must not_ be translated.

### Translation of wiki

This project has a [wiki](/wiki) on GitHub. To translate it, just create the appropriate wiki pages in your local language.
As GitHub does not allow multiple pages to have the same name, you have to adjust it. If the title is different in your language, you can just rename it. If it collides with another existing file, e.g. if the title is the same as in English, append the title with ` (<local language>)`, where `<local language>` is a placeholder for a proper identifier for your language that makes sense to your users. This identifier should be readable by humans and not be an abbreviation as it is displayed as a title on GitHub (i.e. _not_ `de_DE`) and it should also be translated (i.e. _not_ `German`, but `deutsch`). Capitalization and similar things should thus follow your local language. Also the appendix/bracket style (i.e. `(…)`) should follow your local Langauge. As such, if you e.g. always prefix such additional notes, then do it here, too.
Generally said, the whole title must just be translated, but does have to be unique.

If you are done with that, do not forget to edit the [`_Sidebar` file](/wiki/_Sidebar/_edit) and add your language. Keep the English version at the top. The languages afterwards should be kept in alphabetical order. Do use the English name of your language as a heading and link to your newly created pages using their local name.

Do not forget that files in the project's main repository itself often refer to the wiki, so remember to also replace the links in here.

### Internationalisation of HTML files

HTML files are easy to internationalize.
You just have to add the custom `data-i18n` and add the [`__MSG_translationName__`](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization#Predefined_messages) syntax for selecting the value. If the value is empty, the content of the tag will not be translated.

If the `data-i18n` value is present, it will additionally try to translate the hardcoded attributes in `localizedAttributes`, and check whether `data-i18n-attribute` (where `attribute` is an attribute like `alt`) exists and if so, replace the original attribute in the same way. Basically, just have a look at how it is done in the existing parts.

You should always hardcode an English fallback string in the HTML file, so it can use this, if all JS localization fails.

## Coding

### Getting started

Developing/improving a WebExtension add-on is easy! **If you have ever made some stuff with HTML/CSS/JS you can do that, too!** It's built on the same technologies.

* **Debug extension:** Just visit `about:debugging` and load the extension by selecting any file from the Web Extensions' dir. In our case, e.g. select `manifest.json` from the `src` dir. [See a video here.](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Your_first_WebExtension#Installing).
* **Change code:** When it is loaded you can just change the code (and press "Reload", if needed) and you'll see the result. That is it!

If you have made your changes, please ensure that the unit tests still run. See [the section on testing](#tests) for the (easy) way to run them.

### Coding guidelines

As for simple indentation issues, please refer to the [editorconfig file](.editorconfig). Just use a [plugin](http://editorconfig.org/#download), if needed, for your editor.

Apart from that, there are some simple rules.

### General
* Do not introduce new unnecessary permissions. The add-on should require as few permissions as possible.
* Keep the code small. Do not introduce big or unnecessary dependencies. (Better ask before you do.)
* There is a loose width limit at 80 characters, except for HTML and text/Markdown files. HTML files should always be intended properly. "Loose limit" means I won't care if you add 3-5 characters more, but when the line becomes too long, you better split it on two lines, if it makes sense. Always prefer readability over such an arbitrary limit, however, so e.g. JSDOC can always be split onto the next line, while JS commands sometimes look better on a single line, even though it may be _a bit_ longer.

#### JS
* Use EcmaScript 2017. (so e.g. `await`/`async` are fine) Basically everything, which is supported by Firefox >= 60 can also be used.
* We use [ESLint](https://eslint.org/). Please do use it to lint your files. It specifies all coding guidelines. If you use NodeJS, you can install the packages `eslint` and (if you want to write unit tests) `eslint-plugin-mocha` (see [writing tests](#writing-tests)).
  When something is not specified just use common sense and look at how other code in the project is written.
* Especially, as we use a [CSP](src/manifest.json), please do _not_:
   * use inline JavaScript
   * use eval, or other insecure features
   * modify the [CSP](src/manifest.json#L33) :wink:
* We do use [ES6 Modules](https://hacks.mozilla.org/2015/08/es6-in-depth-modules/).
* Avoid `this`, it mostly causes confusion. The pattern used here usually does not need `this`.
* Use early return instead of nested if blocks to keep the code readable.
* Use `const` whenever possible (also in local variables in functions), only use `let` when the variable needs to be changed. Don't use `var`.
* Use the [spread](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/Spread_syntax) and [rest operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) instead of `.apply` or similar.
* If you write real constants (i.e. `const` variables not written in functions, if their scope e.g. is a "module" or whole project, and they do represent static _literals_, e.g. simple variable types, such as integers, strings, but not selected HTML elements), do write them in UPPERCASE_LETTERS (as "real" constants are usually written in other languages), otherwise always write variable names in camelCase.
* Objects, which should never be modified, should be frozen with `Object.freeze`, so they cannot be modified.
* Do _not_ use magic numbers. Use (global/module-scoped) constants instead.
* Do log important things you do in your code. Use the `Logger` for that. In production code no `console.log()` or similar should appear.
* Avoid modifying the DOM in JS. The whole structure of the add-on is so simple it should be represented in the HTML file. Remember that HTML files should represent the (whole) structure of the "website".
* Avoid naming variables by their variable type only, e.g. `element`. Instead try to use the same variable name for an element whenever you refer to it in the source code. E.g. name a message box `elMessage`, so one can search for it in the whole code base to find out, where it is touched.
* You should start the variable names of HTML elements with `el` as they are not obvious to differentiate from other variable names. Otherwise, do not prepend the variable type to the variable name.
* Avoid anonymous functions, which have no name (i.e. not really assigned) unless they do really do simple things. In most cases bigger anonymous functions are a point one may (need to) refactor. Consider introducing some (private) function in the module instead, so the function is described, documented and maybe re-used.

### CSS

* Remember that [WebExtensions automatically](https://discourse.mozilla.org/t/add-ons-have-box-sizing-border-box-by-default/28359) have the CSS property [`box-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing) set to `border-box` instead of `content-box` as on the web.

### Tests

We use _Mocha_, _Chai_ and _Sinon_ for unit tests. However, you do not need to care for these insides if you just want to run them, as they are really easy to run:
* When your add-on is loaded in `about:debugging`, click on "Manifest URL" next to the "Internal UUID".
* You'll see the `manifest.json`. Now change the address in the address bar to `moz-extension://<uuid here>/tests/index.html`. This is the test site, which then runs the tests automatically!
* You do not need to install anything, test libraries are downloaded from the web, automatically. If that does not work, you may have the wrong `manifest.json`, which does not allow loading of these test frameworks. Make sure you have the dev version ([`dev.json`](scripts/manifests/dev.json) in `scripts/manifests/`) loaded in the `src` dir of this add-on.

Tests are defined in the [`src/tests/`](src/tests/) dir.

Due to the fact that we use ES6 modules, [Mocha cannot yet run the tests on the command line](https://github.com/mochajs/mocha/issues/3006) though. We also do use the browser DOM and similar features, so running the tests outside of the browser, is not intended to be supported.

#### Writing tests

As for the Mocha tests, we do have [another EsLint config](src/tests/.eslintrc). To be able to use them, you should install the [EsLint mocha plugin](https://github.com/lo1tuma/eslint-plugin-mocha).

Here some simple rules:
* Do not describe tests as "should". This is superfluous, as we know that tests may behave correct or not. Just use the third-person present tense (e.g. `.it("does something useful")`). Describe the working test, not the error, if it fails.
* Use messages (often third parameter) in the assertions of chai, if useful. Here, describing the case if it fails (e.g. "failed to do XY") is the way to go, as these strings are only shown in case of an error.
* As for chai, write them [in the assert syntax](http://www.chaijs.com/api/assert/).
* Always use `.chai.assert.strictEqual` and not only `.equal` for comparison in tests, unless there is a specific reason not to do so. This way, you also do not need to check for the variable type, yet again. Similarly usually prefer `.calledWithExactly` instead of `.calledWith`.
* If you need to attach/inject HTML code for your test into the HTML page, please use the `htmlMock.js` module provided in the test directory. Generally said, there are some modules from that dir that can be useful for testing particular features. :smile:

### Various stuff

* It is possible to use [symbolic links on Windows with git](https://stackoverflow.com/a/49913019/5008962). You have to make sure to enable that option at the installation of git for Windows and maybe need to re-clone the repo with `git clone -c core.symlinks=true <URL>`.
