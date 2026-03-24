#!/usr/bin/env bash

#MISE description="Update npm dependencies and show outdated packages"

set -ueC
set -o pipefail

npm up
npm outdated || true
