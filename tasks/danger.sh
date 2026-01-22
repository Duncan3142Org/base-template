#!/usr/bin/env bash

set -ueC
set -o pipefail

npm exec -- danger ci --fail-on-warnings=true
