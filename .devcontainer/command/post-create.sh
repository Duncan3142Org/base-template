#! /usr/bin/env bash

set -ueC
set -o pipefail

apt-get update
apt-get install --yes --no-install-recommends \
	dbus-bin \
	libsecret-tools \
	libev4 libpcre3 \
	docker-ce-cli docker-compose-plugin docker-buildx-plugin

if command -v mise &>/dev/null; then
	mise self-update -y -q
else
	curl https://mise.run | sh
fi
mise trust -q

cat >> "/root/.bashrc" << 'EOF'

# Mise
eval "$(mise activate bash)"
. /etc/profile.d/mise-tokens.sh
EOF
