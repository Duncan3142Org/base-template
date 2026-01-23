#!/usr/bin/env bash

#MISE description "Format source code"
#USAGE arg "[mode]" help="Format mode" default="check" {
#USAGE   choices "check" "write"
#USAGE }

set -ueC
set -o pipefail

npm exec -- prettier "--${usage_mode?}" --cache --cache-location='.prettier/cache' --cache-strategy content .
