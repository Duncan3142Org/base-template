#!/usr/bin/env bash

#MISE description "Danger"

set -ueC
set -o pipefail

npm install --no-save \
  @commitlint/lint@20 \
  @commitlint/load@20 \
  danger@13 \
  remark@15

danger ci --failOnErrors --failOnWarnings --dangerfile .github/cicd/dangerfile.ts
