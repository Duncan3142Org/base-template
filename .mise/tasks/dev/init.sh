#!/usr/bin/env bash

#MISE description="Set up Git hooks and GitHub CLI auth"

# Git hooks and commit message template
echo "⚙️  Setting up Git hooks and commit message template..."
husky
git config commit.template .gitmessage
echo "  ✅  Git hooks and commit message template configured."

# GitHub CLI
gh_token=$(secret-tool lookup service gh:github.com | tr -d '\n')
echo "🔑  Authenticating GitHub CLI..."
if [ -n "${gh_token:-}" ]; then
    echo -n "${gh_token}" | gh auth login --with-token
    echo "  ✅  GitHub CLI authenticated."
else
    echo "  ⚠️  No GitHub token found in secret-tool"
fi
