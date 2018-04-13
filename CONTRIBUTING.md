Nice to see you want to contribute! :+1:

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
* Use early return instead of nested if blocks, to keep the code readable.
* Use `const` where possible, only use `let` when the variable needs to be changed. Don't use `var`.
* Objects, which should never be modified, should be frozen with `Object.freeze`, so they cannot be modified.

## Translations

The English "you" should be translated in a personal way, if the target language differentiates between "you" for "anybody"/"they" and "you" for "the user of this extension". In German, that e.g. means you can translate it with "du [kannst etwas machen]" instead of "man [kann etwas machen]".

### Internationalisation of HTML files

HTML files are easy to internationalize.
You just have to add the custom `data-i18n` and add the [`__MSG_translationName__`](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization#Predefined_messages) syntax for selecting the value.. If the value is empty, the content of the tag will not be translated.

If the `data-i18n` value is present, it will additionally try to translate the hardcoded attributes in `localizedAttributes`, and check whether `data-i18n-attribut` (where attribut ios the attribut like `alt` exists) and replace the original attribut in the same way.

You should always hardcode an English fallback string in the HTML file, so it can use this, if all JS localization fails.
