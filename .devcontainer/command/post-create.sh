#! /usr/bin/env bash

set -ueC
set -o pipefail

curl https://mise.run | sh

mise reshim

mise install

cat >> "/root/.bashrc" << 'EOF'
# Mise
eval "$(mise activate bash)"
EOF
