#! /usr/bin/env bash

set -ueC
set -o pipefail

mise_update() {
	mise install
	mise upgrade
	mise lock
	mise reshim
}

(
	cd "$HOME"
	mise_update
)

mise_update
mise run sync-root-lock

mise run init
