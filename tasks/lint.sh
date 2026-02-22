#!/usr/bin/env bash

#MISE description "Lint source code"
#USAGE arg "[fix]" help="Fix mode" default="false" {
#USAGE   choices "true" "false"
#USAGE }

set -ueC
set -o pipefail

TIMING=1 LINT_ALL=true eslint --fix="${usage_fix?}" .
