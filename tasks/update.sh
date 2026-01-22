#!/usr/bin/env bash

set -ueC
set -o pipefail

npm up
npm outdated
