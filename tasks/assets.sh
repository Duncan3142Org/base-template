#!/usr/bin/env bash

#MISE description "Assets"

set -ueC
set -o pipefail

npm exec -- tsc --build
