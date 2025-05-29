#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.author Chris Bailey
# @raycast.authorURL https://raycast.com/that70schris
# @raycast.packageName System
# @raycast.title Bottle
# @raycast.mode silent
# @raycast.icon 🍺

export HOMEBREW_BUNDLE_FILE=~/Brewfile
brew bundle dump --force
echo "bottled"
