#!/bin/bash

  set -o errexit
  set -o nounset

 FILE_REMOTE="projects/across/frontend/outputs/output.env"
 FILE_PATH="src/output.env"

 if [ -n "${GH_TOKEN}" ]; then
     echo "Getting env files from config repo..."
     curl -o ${FILE_PATH} "https://${GIT_ENV_URL}"
    #  curl -H 'Authorization: token ${GH_TOKEN}' \
    #     -o ${FILE_PATH} \
    #     -H 'Accept: application/vnd.github.v3.raw' \
    #     -O \
    #     -L https://raw.githubusercontent.com/${GIT_ENV_REPO}/${FILE_REMOTE}
    #  echo "Updated data at ${FILE_PATH}"
     echo "exporting.."
     cat ${FILE_PATH}
     source ${FILE_PATH}
     echo $GIT_ENV_EXPORTED
 else
     echo "No env exported"
 fi
