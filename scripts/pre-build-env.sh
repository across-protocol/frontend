#!/bin/bash

  set -o errexit
  set -o nounset

 FILE_REMOTE="projects/across/frontend/outputs/output.env"
 FILE_PATH="output.env"
 GH_REPO="UMAprotocol/git-env"

 if [ -n "${GH_TOKEN}" ]; then
     echo "Getting env files from config repo..."
     curl -o ${FILE_PATH} "https://${GH_TOKEN}@${GH_REPO}/${FILE_REMOTE}"
     echo "Updated data at ${FILE_PATH}"
     echo $GIT_ENV_EXPORTED
     echo "Done!"
 else
     echo "No env exported"
 fi
