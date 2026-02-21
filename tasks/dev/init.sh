#!/usr/bin/env bash

#MISE description "Init local repo"

# Git hooks and commit message template
echo "⚙️  Setting up Git hooks and commit message template..."
husky
git config commit.template .gitmessage
echo "  ✅  Git hooks and commit message template configured."

# Gemini credentials
echo "🔑  Configuring Gemini credentials..."
if [ -f /run/secrets/gemini_auth ]; then
    mkdir -p ~/.gemini
    cp /run/secrets/gemini_auth ~/.gemini/oauth_creds.json
    echo "  ✅  Gemini credentials configured."
fi

# Claude credentials
echo "🔑  Configuring Claude credentials..."
if [ -f /run/secrets/claude_auth ]; then
    mkdir -p ~/.claude
    cp /run/secrets/claude_auth ~/.claude/.credentials.json
    echo "  ✅  Claude credentials configured."
fi
