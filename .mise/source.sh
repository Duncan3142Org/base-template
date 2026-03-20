# shellcheck shell=sh

if [ -z "${GITHUB_PKG_TOKEN:-}" ]; then
	github_pkg_token=$(secret-tool lookup service 'packages:github' user "${GITHUB_USERNAME}" | tr -d '\n')
	export GITHUB_PKG_TOKEN="${github_pkg_token}"
fi
