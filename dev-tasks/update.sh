#!/usr/bin/env bash

#MISE description "Update"

set -ueC
set -o pipefail

npm up
npm outdated
