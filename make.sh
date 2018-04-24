#!/bin/sh

EXTENSION_NAME="offline-qr-code@rugk.github.io"

mkdir "build"

# license should be in add-on
mv LICENSE.md src/LICENSE.md

# create XPI
cd src || exit
zip -r -FS "../build/$EXTENSION_NAME.xpi" ./*

mv LICENSE.md ../LICENSE.md
cd ..
