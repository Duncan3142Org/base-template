#!/usr/bin/env bash

#MISE description="Check or write source formatting"

#USAGE flag "--mode <mode>" {
#USAGE   choices "check" "write"
#USAGE   default "check"
#USAGE   help "Formatting mode"
#USAGE }

set -ueC
set -o pipefail

npm exec -- prettier "--${usage_mode:?}" --cache --cache-location='.prettier/cache' --cache-strategy content .

terraform fmt -"${usage_mode:?}" -recursive .github/environments/
