#!/usr/bin/env bash

#MISE description "Formats the code"
#USAGE flag "--check" help="Check if files are formatted"

set -ueC
set -o pipefail

if [[ "${usage_check:-false}" == "true" ]]; then
  flag="--check"
else
  flag="--write"
fi

npm exec -- prettier "$flag" --cache --cache-location='.prettier/cache' --cache-strategy content .
