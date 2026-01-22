#!/usr/bin/env bash

set -ueC
set -o pipefail

npx --yes \
  -p semantic-release@25 \
  -p @semantic-release/changelog \
  -p @semantic-release/git \
  semantic-release
