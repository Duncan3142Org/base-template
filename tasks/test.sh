#!/usr/bin/env bash

#MISE description "Test"

set -ueC
set -o pipefail

npm exec -- vitest run
