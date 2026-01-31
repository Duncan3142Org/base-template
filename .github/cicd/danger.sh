#!/usr/bin/env bash

#MISE description "Danger"

set -ueC
set -o pipefail

npm install --no-save \
  @commitlint/lint@24 \
  @commitlint/load@24 \
  commonmark@0.31

danger ci --fail-on-warnings=true --dangerfile .github/cicd/dangerfile.js
