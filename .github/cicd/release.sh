#!/usr/bin/env bash

#MISE description "Publish artifacts to registry"
#USAGE flag "--dry" help="Perform a dry run without publishing"

set -ueC
set -o pipefail

npx --yes \
  -p semantic-release@25 \
  -p @semantic-release/changelog \
  -p @semantic-release/git \
  semantic-release --dry-run="${usage_dry:-false}"
