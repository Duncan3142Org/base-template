#!/usr/bin/env bash

#MISE description="Check or fix lint issues"

#USAGE flag "--fix" {
#USAGE   help "Apply ESLint fixes"
#USAGE }

set -ueC
set -o pipefail

TIMING=1 LINT_ALL=true npm exec -- eslint --fix="${usage_fix:-false}" .
