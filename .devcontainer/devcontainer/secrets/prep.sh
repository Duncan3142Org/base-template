#!/usr/bin/env bash

set -ue
set -o pipefail

echo "Prepping secrets..."

# GitHub
gh auth token > gh_token
github_pkg_token=$(secret-tool lookup service github_packages user "${GITHUB_USERNAME}" purpose "Personal Access Token")
echo "$github_pkg_token" > github_pkg_token

# Terraform
if [ -f "$HOME/.terraform.d/credentials.tfrc.json" ]; then
		cat "$HOME/.terraform.d/credentials.tfrc.json" | jq -r '.credentials."app.terraform.io".token' > tf_token
else
		echo "Warning: No Terraform credentials found."
fi

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
