#! /usr/bin/env bash

set -ueC
set -o pipefail

gpgconf --launch gpg-agent || true

(
	cd ./.devcontainer/devcon/secrets
	./prep.sh
)
(
	cd ./.devcontainer/devcon
	if ! [ -f .env ]; then
		cp .env.example .env
	fi
)
