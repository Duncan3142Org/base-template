#!/usr/bin/env bash

set -ue
set -o pipefail

echo "Prepping secrets..."

# GitHub
gh auth token | tr -d '\n' > gh_token
github_pkg_token=$(secret-tool lookup service github_packages user "${GITHUB_USERNAME}")
echo -n "$github_pkg_token" > github_pkg_token
