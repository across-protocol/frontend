#!/bin/bash

  set -o errexit
  set -o nounset

 BASE_URL="${GIT_ENV_REPO}/across/frontend/outputs/"

 if [ -n "${GH_TOKEN}" ]; then
    
    files=(output.env output_api.env)
    
    for file in "${files[@]}"; do
        echo "Downloading $file..."
        curl -H "Authorization: token ${GH_TOKEN}" -L "${BASE_URL}${file}" -o "./${file}"
        cp ./${file} ./api/${file}
        cat ./${file}
    done
    echo "All files downloaded."

 else
    echo "No env exported"
 fi
