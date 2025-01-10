#!/bin/bash

  set -o errexit
  set -o nounset

 FILE_REMOTE="projects/across/frontend/outputs/output.env"
 FILE_PATH="/tmp/output.env"

 if [ -n "${GH_TOKEN}" ]; then
     echo "Getting env files from config repo..."
     curl -o ${FILE_PATH} "https://${GH_TOKEN}@${GIT_ENV_REPO}/${FILE_REMOTE}"
     echo "Updated data at ${FILE_PATH}"
     echo "exporting.."
     source /tmp/output.env
     echo $GIT_ENV_EXPORTED
 else
     echo "No env exported"
 fi
