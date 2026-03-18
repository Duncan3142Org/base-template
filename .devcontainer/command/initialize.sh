#! /usr/bin/env bash

set -ueC
set -o pipefail

gpgconf --launch gpg-agent || true

(
	cd ./.devcontainer/devcontainer/secrets
	./prep.sh
)
(
	cd ./.devcontainer/devcontainer
	if ! [ -f .env ]; then
		cp .env.example .env
	fi
)
