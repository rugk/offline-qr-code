Nice to see you want to contribute! :+1:

## Translations

It would be great, if you can contribute your translations! Currently, it is unfortunately only possible to translate the JSOn files directly.
To do so, go to [`_locales/en`](_locales/en) and copy the English [`messages.json`](_locales/en/messages.json) file. (You could also use another source language if you want, but usually English is the best.) Create a new dir at [`_locales`](_locales) with the abbreviation of the language you want to translate.

At the end, just submit a Pull Request.
Of course, you can (and should) improve existing translations.

For more details, [see the official docs](https://developer.mozilla.org/Add-ons/WebExtensions/Internationalization#Providing_localized_strings_in__locales).

## Coding guidelines

As for simple indentation issues, please refere to the [editorconfig file](.editoconfig). Just use a [plugin](http://editorconfig.org/#download), if needed, for your editor.

Apart from that, there are some simple rules.

### JS
* Use EcmaScript 6!
* We use [JSHint](.jshintrc). Please do use it to lint your files.
* Especially, as we use a [CSP](manifest.json), please do *not*:
   * use inline JavaScript
   * use eval, or other insecure features
   * modify the [CSP](manifest.json#L20) :wink:
* The code uses a kind of "Revealing Module Pattern", where the variable `me` contains all public methods (and, theoretically, properties).
* Avoid `this`, it mostly causes confusion. The pattern used here, usually does not need `this`.
* Use early return instead of nested if blocks, to keep the code readable.
* Use `const` whenever possible (also in local variables in functions), only use `let` when the variable needs to be changed. Don't use `var`.
* If you write real constants (i.e. `const` variables not written in functions, if their scope e.g. is a "module" or whole project, and which do represent static _literals_, e.g. simple variable types, such as integers, strings, but not selected HTML elements), do write them in UPPERCASE, otherwise write them as usual variables in camelCase.
* Objects, which should never be modified, should be frozen with `Object.freeze`, so they cannot be modified.

## Translations

The English "you" should be translated in a personal way, if the target language differentiates between "you" for "anybody"/"they" and "you" for "the user of this extension". In German, that e.g. means you can translate it with "du [kannst etwas machen]" instead of "man [kann etwas machen]".

### Internationalisation of HTML files

HTML files are easy to internationalize.
You just have to add the custom `data-i18n` and add the [`__MSG_translationName__`](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization#Predefined_messages) syntax for selecting the value.. If the value is empty, the content of the tag will not be translated.

If the `data-i18n` value is present, it will additionally try to translate the hardcoded attributes in `localizedAttributes`, and check whether `data-i18n-attribut` (where attribut ios the attribut like `alt` exists) and replace the original attribut in the same way.

You should always hardcode an English fallback string in the HTML file, so it can use this, if all JS localization fails.
