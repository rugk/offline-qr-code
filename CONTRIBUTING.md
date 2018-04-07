Nice to see you want to contribute! :+1:

## Coding guidelines

As for simple indentation issues, please refere to the [editorconfig file](.editoconfig). Just use a [plugin](http://editorconfig.org/#download), if needed, for your editor.

Apart from that, there are some simple rules.

### JS
* We use [JSHint](.jshintrc). Please do use it to lint your files.
* Especially, as we use a [CSP](manifest.json), please do *not*:
   * use inline JavaScript
   * use eval, or other insecure features
   * modify the [CSP](manifest.json#L20) :wink:
* The code uses a kind of "Revealing Module Pattern", where the variable `me` contains all public methods (and, theoretically, properties).
* Use early return instead of nested if blocks, to keep the code readable.
