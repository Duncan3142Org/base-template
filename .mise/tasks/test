#!/usr/bin/env bash

#MISE description="Run unit or integration tests"

#USAGE flag "--mode <mode>" {
#USAGE   choices "integration" "unit" "contract"
#USAGE   default "unit"
#USAGE   help "Test suite to run"
#USAGE }

set -ueC
set -o pipefail

mode="${usage_mode?}"

npm exec -- vitest run --config "./vitest.${mode}.config.js"
