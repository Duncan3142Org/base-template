#!/usr/bin/env bash

set -ue
set -o pipefail

echo "Prepping secrets..."

gh auth token > gh_token

echo "$GITHUB_PKG_TOKEN" > github_pkg_token

cat /home/dg/.terraform.d/credentials.tfrc.json | jq -r '.credentials."app.terraform.io".token' > tf_token

# Gemini
if [ -f "$HOME/.gemini/oauth_creds.json" ]; then
    cp "$HOME/.gemini/oauth_creds.json" gemini_auth
else
    echo "Warning: No Gemini credentials found."
fi

# Claude
if [ -f "$HOME/.claude/.credentials.json" ]; then
    cp "$HOME/.claude/.credentials.json" claude_auth
else
    echo "Warning: No Claude credentials found."
fi
