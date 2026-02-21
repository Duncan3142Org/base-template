#!/usr/bin/env bash

#MISE description "Lint source code"
#USAGE arg "[mode]" help="Lint mode" default="check" {
#USAGE   choices "check" "fix"
#USAGE }

set -ueC
set -o pipefail

echo "No linter configured."
