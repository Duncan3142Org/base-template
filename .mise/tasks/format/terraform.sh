#!/usr/bin/env bash

#MISE description="Check or fix HCL formatting"

#USAGE flag "--mode <mode>" {
#USAGE   choices "check" "write"
#USAGE   default "check"
#USAGE   help "Formatting mode"
#USAGE   env "FORMAT_MODE"
#USAGE }

set -ueC
set -o pipefail

terraform fmt -"${usage_mode:?}" -recursive .github/environments/
