#!/bin/sh

EXTENSION_NAME="offlineqr"

# license should be in add-on
mv LICENSE.md src/LICENSE.md

# create XPI
cd src
zip -r -FS "../$EXTENSION_NAME.xpi" *

mv LICENSE.md ../LICENSE.md
cd ..
