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

# Initialize pass
if command -v pass >/dev/null && command -v gpg >/dev/null; then
    if [ ! -d "$HOME/.password-store" ]; then
        echo "Initializing pass for secure credential storage..."

        GPG_EMAIL="devcontainer@local"

        if ! gpg --list-secret-keys "$GPG_EMAIL" > /dev/null 2>&1; then
             echo "Generating GPG key..."
             cat > /tmp/gpg_batch <<EOF
%echo Generating a basic OpenPGP key
Key-Type: RSA
Key-Length: 2048
Subkey-Type: RSA
Subkey-Length: 2048
Name-Real: DevContainer
Name-Email: \$GPG_EMAIL
Expire-Date: 0
%no-protection
%commit
EOF
             gpg --batch --generate-key /tmp/gpg_batch
             rm /tmp/gpg_batch
        fi

        pass init "\$GPG_EMAIL"
    fi
fi
