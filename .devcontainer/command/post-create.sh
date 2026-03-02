#! /usr/bin/env bash

set -ueC
set -o pipefail

curl https://mise.run | sh

cat >> "/root/.bashrc" << 'EOF'
# Mise
eval "$(mise activate bash)"
EOF

curl -fsSL https://claude.ai/install.sh | bash
