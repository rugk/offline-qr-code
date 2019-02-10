#!/bin/sh
#
# Makes a release ZIP of the add-on.
#

EXTENSION_NAME="offline-qr-code@rugk.github.io"

mkdir -p "build"

# license should be in add-on
mv LICENSE.md src/LICENSE.md

# make sure we are using the stable manifest
# as the dev edition manifest.json allows mocha.css and mocha.js in the CSP
cp "./scripts/manifests/firefox.json" "./src/manifest.json" || exit

# create zip
cd src || exit
zip -r -FS "../build/$EXTENSION_NAME.xpi" ./* -x "tests/*" -x "**/tests/*" \
    -x "docs/*" -x "**/docs/*" \
    -x "example/*" -x "**/example/*" -x "**/*.example" \
    -x "**/README.md" -x "**/CONTRIBUTING.md" -x "**/manifest.json" \
    -x "**/.git" -x "**/.gitignore" -x "**/.gitmodules" -x "**/.eslintrc" \
    -x "**/.editorconfig"

# revert changes
mv LICENSE.md ../LICENSE.md
cp "../scripts/manifests/dev.json" "../src/manifest.json"

cd ..
