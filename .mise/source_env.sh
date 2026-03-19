#! /usr/bin/env bash

set -ueC
set -o pipefail

if [ -z "${GITHUB_PKG_TOKEN:-}" ]; then
	github_pkg_token=$(cat /run/secrets/github_pkg_token)
	export GITHUB_PKG_TOKEN="${github_pkg_token}"
fi

# if [ -z "${GITHUB_PKG_TOKEN:-}" ]; then
# 	github_pkg_token=$(secret-tool lookup service github_packages user "${GITHUB_USERNAME}")
# 	export GITHUB_PKG_TOKEN="${github_pkg_token}"
# fi

if [ -z "${MISE_GITHUB_TOKEN:-}" ]; then
	export MISE_GITHUB_TOKEN="${github_pkg_token}"
fi

# if [ -z "${GH_TOKEN:-}" ]; then
# 	gh_token=$(secret-tool lookup service gh:github.com)
# 	export GH_TOKEN="${gh_token}"
# fi
