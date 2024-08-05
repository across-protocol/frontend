#!/bin/bash

 set -o errexit
 set -o nounset

FILE="fill-times.json"
FILE_PATH="src/data/fill-times-preset.json"

if [ -n "${gh_tkn}" ]; then
    echo "Getting files from config repo..."
    curl -o ${FILE_PATH} "https://${gh_tkn}@${gh_repo}/${FILE}"
    echo "Updated data at ${FILE_PATH}"
    echo "Done!"
else
    cat src/data/fill-times-example.json > ${FILE_PATH}
    echo "Using default data at ${FILE_PATH}"
    echo "Done!"
fi
