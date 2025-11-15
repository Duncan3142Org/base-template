#!/usr/bin/env bash

set -ueC
set -o pipefail

npm exec -- prettier --write --cache --cache-location='.prettier/cache' --cache-strategy content .
