#!/usr/bin/env bash

#MISE description "Publish registry artifacts"
#USAGE flag "--dry" help="Perform a dry run without publishing"

set -ueC
set -o pipefail

npx --yes \
  -p semantic-release@25 \
  -p @semantic-release/changelog@6 \
  -p @semantic-release/git@10 \
  semantic-release --dry-run="${usage_dry:-false}"
