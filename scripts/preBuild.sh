#!/bin/bash

 set -o errexit
 set -o nounset

FILE="fill-times.json"
FILE_PATH="src/data/fill-times.json"

if [ -n "${GH_TOKEN}" ]; then
    echo "Getting files from config repo..."
    curl -o ${FILE_PATH} "https://${GH_TOKEN}@${GH_REPO_URL}/${FILE}"
    echo "Updated data at ${FILE_PATH}"
    echo "Done!"
else
    cat src/data/fill-times-preset.json > ${FILE_PATH}
    echo "Using default data at ${FILE_PATH}"
    echo "Done!"
fi
