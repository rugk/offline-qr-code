Nice to see you want to contribute! :+1:

## Translations

It would be great, if you can contribute your translations! Currently, it is unfortunately only possible to translate the JSON files directly.
To do so, go to [`src/_locales/en`](src/_locales/en) and copy the English [`messages.json`](src/_locales/en/messages.json) file. (You could also use another source language if you want, but usually English is the best.) Create a new dir at [`src/_locales`](src/_locales) with the abbreviation of the language you want to translate.

At the end, just submit a Pull Request.
Of course, you can (and should) improve existing translations.

For more details, [see the official docs](https://developer.mozilla.org/Add-ons/WebExtensions/Internationalization#Providing_localized_strings_in__locales).

### Translation style

The English "you" should be translated in a personal way, if the target language differentiates between "you" for "anybody"/"they" and "you" for "the user of this extension". In German, that e.g. means you can translate it with "du [kannst etwas machen]" instead of "man [kann etwas machen]".

### Translations of add-on description

All texts shown on AMO (addons.mozilla.org) are maintained in [`assets/texts`](assets/texts). Again, you can use the English template there.
The files have different formats, but all of them are easily translatable with any text editor.
Note that the `amoScreenshots.csv` file refers to the screenshot descriptions you can see when you click on the screenshots of AMO. The first column there is the file name, which you can see in [`assets/screenshots`](assets/screenshots), and does _not_ need to be translated.

### Internationalisation of HTML files

HTML files are easy to internationalize.
You just have to add the custom `data-i18n` and add the [`__MSG_translationName__`](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization#Predefined_messages) syntax for selecting the value.. If the value is empty, the content of the tag will not be translated.

If the `data-i18n` value is present, it will additionally try to translate the hardcoded attributes in `localizedAttributes`, and check whether `data-i18n-attribut` (where `attribut` is an attribut like `alt`) exists and if so, replace the original attribut in the same way. Basically, just have a look at how it is done in the existing parts.

You should always hardcode an English fallback string in the HTML file, so it can use this, if all JS localization fails.

## Coding

### Getting started

Developing/improving a WebExtension add-on is easy! **If you have ever made some stuff with HTML/CSS/JS you can do that, too!** It's built on the same technologies.

* **Debug extension:** Just visit `about:debugging` and load the extension by selecting any file from the Web Extensions' dir. [See a video here.](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Your_first_WebExtension#Installing).
* **Change code:** When it is loaded you can just change the code (and press "Reload", if needed) and you'll see the result. That is it!

### Coding guidelines

As for simple indentation issues, please refer to the [editorconfig file](.editorconfig). Just use a [plugin](http://editorconfig.org/#download), if needed, for your editor.

Apart from that, there are some simple rules.

### General
* Do not introduce new unnecessary permissions. The add-on should require as few permissions as possible.
* Keep the code small. Do not introduce big or unnecessary dependencies. (Better ask before you do.)

#### JS
* Use EcmaScript 2017. (so e.g. `await`/`async` are fine) Basically everything, which is supported by Firefox >= 57 can also be used.
* We use [ESLint](https://eslint.org/). Please do use it to lint your files. It specifies all coding guidelines.
  When something is not specified just use common sense and look at how other code in the project is written.
* Especially, as we use a [CSP](src/manifest.json), please do *not*:
   * use inline JavaScript
   * use eval, or other insecure features
   * modify the [CSP](src/manifest.json#L33) :wink:
* The code uses a kind of "Revealing Module Pattern", where the variable `me` contains all public methods (and, theoretically, properties).
* Avoid `this`, it mostly causes confusion. The pattern used here, usually does not need `this`.
* Use early return instead of nested if blocks, to keep the code readable.
* Use `const` whenever possible (also in local variables in functions), only use `let` when the variable needs to be changed. Don't use `var`.
* If you write real constants (i.e. `const` variables not written in functions, if their scope e.g. is a "module" or whole project, and which do represent static _literals_, e.g. simple variable types, such as integers, strings, but not selected HTML elements), do write them in UPPERCASE, otherwise write them as usual variables in camelCase.
* Objects, which should never be modified, should be frozen with `Object.freeze`, so they cannot be modified.
* Do _not_ use magic numbers. Use (global) constants instead.
* Do log important things you do in your code. Use the `Logger` for that. In production code no `console.log()` or similar should appear.
