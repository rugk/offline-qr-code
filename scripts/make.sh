#!/bin/sh

EXTENSION_NAME="offline-qr-code@rugk.github.io"

mkdir -p "build"

# license should be in add-on
mv LICENSE.md src/LICENSE.md

# make sure we are using the stable manifest
# as the dev edition manifest.json allows mocha.css and mocha.js in the CSP
cp "./scripts/manifests/firefox.json" "./src/manifest.json" || exit

# create zip
cd src || exit
zip -r -FS "../build/$EXTENSION_NAME.zip" ./*

# revert changes
mv LICENSE.md ../LICENSE.md
cp "../scripts/manifests/dev.json" "../src/manifest.json"

cd ..
