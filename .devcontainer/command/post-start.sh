#! /usr/bin/env bash

set -ueC
set -o pipefail

# Source the mise profile.d script for lifecycle commands
. /etc/profile.d/mise-tokens.sh

if [ -z "${MISE_GITHUB_TOKEN:-}" ]; then
	echo "MISE_GITHUB_TOKEN is not set. Please set it to avoid rate limits." >&2
	exit 1
fi

mise_update() {
	mise install
	mise upgrade
	mise outdated -l || true
	mise lock
	mise reshim
}

(
	cd "$HOME"
	mise_update
)

mise_update

mise run dev:init
mise run dev:update
