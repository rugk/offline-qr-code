#!/bin/sh

EXTENSION_NAME="offlineqr"

mkdir "build"

# license should be in add-on
mv LICENSE.md src/LICENSE.md

# create XPI
cd src
zip -r -FS "../build/$EXTENSION_NAME.xpi" *

mv LICENSE.md ../LICENSE.md
cd ..
