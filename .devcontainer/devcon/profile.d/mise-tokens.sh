# shellcheck shell=sh

if [ -z "${MISE_GITHUB_TOKEN:-}" ]; then
	mise_github_token=$(secret-tool lookup service 'noscope:github' user "${GITHUB_USERNAME}" | tr -d '\n')
	export MISE_GITHUB_TOKEN="${mise_github_token}"
fi
