#!/usr/bin/env bash

#MISE description "Init local repo"

# 'clone-of' remote
echo "🔍  Checking for 'clone-of' property to set up template remote..."
TEMPLATE_URL=$(gh api "repos/:owner/:repo/properties/values" --jq '.[] | select(.property_name == "clone-of") | .value')
if [ -n "$TEMPLATE_URL" ] && [ "$TEMPLATE_URL" != "null" ]; then
  echo "  ✅  Found template source: $TEMPLATE_URL"
  git remote add template "$TEMPLATE_URL"
  git fetch template
else
  echo "  ⚠️  This repo does not have a 'clone-of' property set."
fi

# Git hooks and commit message template
echo "⚙️  Setting up Git hooks and commit message template..."
husky
git config commit.template .gitmessage
echo "  ✅  Git hooks and commit message template configured."
