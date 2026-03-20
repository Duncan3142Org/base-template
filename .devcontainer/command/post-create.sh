#! /usr/bin/env bash

set -ueC
set -o pipefail

apt-get update
apt-get install --yes --no-install-recommends \
	dbus-bin \
	libsecret-tools \
	docker-ce-cli docker-compose-plugin docker-buildx-plugin

curl https://mise.run | sh
mise trust -q

cat >> "/root/.bashrc" << 'EOF'

# Mise
eval "$(mise activate bash)"
. /etc/profile.d/mise-tokens.sh
EOF
