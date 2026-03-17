#!/usr/bin/env bash

#MISE description "Run tests"
#USAGE flag "--mode <mode>" {
#USAGE   choices "integration" "unit"
#USAGE   default "unit"
#USAGE   help "Test mode"
#USAGE }

set -ueC
set -o pipefail

mode="${usage_mode?}"

npm exec -- vitest run --config "./vitest.${mode}.config.js"
