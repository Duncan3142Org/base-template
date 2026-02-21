#!/usr/bin/env bash

#MISE description "Init local repo"

# Git hooks and commit message template
echo "⚙️  Setting up Git hooks and commit message template..."
husky
git config commit.template .gitmessage
echo "  ✅  Git hooks and commit message template configured."

# GitHub CLI
echo "🔑  Authenticating GitHub CLI..."
if [ -f /run/secrets/gh_token ]; then
    gh auth login --with-token < /run/secrets/gh_token
    echo "  ✅  GitHub CLI authenticated."
else
    echo "  ⚠️  No GitHub token found in /run/secrets/gh_token"
fi
