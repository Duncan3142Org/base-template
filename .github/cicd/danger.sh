#!/usr/bin/env bash

#MISE description "Danger"

set -ueC
set -o pipefail

danger ci --fail-on-warnings=true --dangerfile .github/cicd/dangerfile.ts
