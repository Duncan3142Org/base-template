#!/usr/bin/env bash

#MISE description="Install npm dependencies"

set -ueC
set -o pipefail

npm ci
