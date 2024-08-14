#!/usr/bin/env bash

set -o errexit

FILE=exclusive-relayer-config.json
FILE_PATH="src/data/$FILE"
REMOTE="https://raw.githubusercontent.com/across-protocol/exclusive-relayer-configs"

# Default branch to use if no commit hash is provided
DEFAULT_BRANCH="master"

# Check if a commit hash was provided
if [ -z "$1" ]; then
    echo "Fetching file from master@latest"
    COMMIT_HASH=$DEFAULT_BRANCH
else
    echo "Fetching file from commit: $1"
    COMMIT_HASH=$1
fi

URL="$REMOTE/$COMMIT_HASH/$FILE"

echo "Fetching exclusive-relayer-config"
curl -o $FILE_PATH $URL
echo "🚀 Relayer config successfully updated at $FILE_PATH"