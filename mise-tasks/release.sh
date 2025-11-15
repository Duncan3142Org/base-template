#!/usr/bin/env bash

set -ueC
set -o pipefail

npx --yes -- semantic-release@25
