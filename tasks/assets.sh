#!/usr/bin/env bash

#MISE description "Build"

#USAGE #USAGE arg "[no-emit]" help="Check mode" default="false" {
#USAGE   choices "true" "false"
#USAGE }

set -ueC
set -o pipefail

tsc --build --noEmit="${usage_no_emit?}"
