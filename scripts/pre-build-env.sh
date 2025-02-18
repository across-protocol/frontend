#!/bin/bash

set -o errexit

BASE_URL="${GIT_ENV_REPO}/${GIT_ENV_PROJECT}/outputs/"

if [ -n "${GH_TOKEN}" ]; then
  files=(output_vercel_build.env output_vercel_api.env)
  
  for file in "${files[@]}"; do
    curl -H "Authorization: token ${GH_TOKEN}" -L "${BASE_URL}${file}" -o "./${file}"
  done
  echo "All files downloaded."
else
  echo "No env exported"
fi
