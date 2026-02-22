#!/usr/bin/env bash

#MISE description "Lint source code"
#USAGE flag "--fix" help="Fix mode"

set -ueC
set -o pipefail

TIMING=1 LINT_ALL=true npm exec -- eslint --fix="${usage_fix?}" .
