#!/usr/bin/env bash

#MISE description "Publish registry artifacts"
#USAGE flag "--dry" help="Perform a dry run without publishing"

set -ueC
set -o pipefail

semantic-release --dry-run="${usage_dry:-false}"
