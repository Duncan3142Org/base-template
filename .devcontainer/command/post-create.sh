#! /usr/bin/env bash

set -ueC
set -o pipefail

apt-get update
apt-get install --yes --no-install-recommends dbus-bin libsecret-tools

curl https://mise.run | sh

cat >> "/root/.bashrc" << 'EOF'

# Mise
eval "$(mise activate bash)"
EOF
