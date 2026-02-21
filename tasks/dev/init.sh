#!/usr/bin/env bash

#MISE description "Init local repo"

# Git hooks and commit message template
echo "⚙️  Setting up Git hooks and commit message template..."
husky
git config commit.template .gitmessage
echo "  ✅  Git hooks and commit message template configured."
