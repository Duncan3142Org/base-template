#! /usr/bin/env bash

set -ueC
set -o pipefail

# Start D-Bus proxy for org.freedesktop.secrets (host keyring access)
sock="$(pwd)/.devcontainer/runtime/secrets.sock"
pkill -f "xdg-dbus-proxy.*${sock}" || true
rm -f "$sock"
setsid xdg-dbus-proxy "$DBUS_SESSION_BUS_ADDRESS" "$sock" \
	--filter \
	--talk=org.freedesktop.secrets &

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
