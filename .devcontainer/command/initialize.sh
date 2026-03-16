#! /usr/bin/env bash

set -ueC
set -o pipefail

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
