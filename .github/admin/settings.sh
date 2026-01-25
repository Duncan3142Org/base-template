#!/usr/bin/env bash

#MISE description "Sync repo settings"

set -ueC
set -o pipefail

# Tool checks
if ! command -v gh &> /dev/null; then
  echo "❌  Error: GitHub CLI (gh) is not installed." >&2
  exit 1
fi

echo "🔍  Resolving repository from local git context..."
if ! REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null); then
  echo "  ❌  Error: Could not detect GitHub repository in the current directory." >&2
  exit 1
fi
echo "  🎯  Target Repository: $REPO"

# Pull request settings
echo "⚙️  Enforcing repository standards..."
gh repo edit "$REPO" \
    --enable-rebase-merge=false \
    --enable-squash-merge=true \
    --enable-merge-commit=false \
    --enable-auto-merge=true \
    --delete-branch-on-merge=true \
    --allow-update-branch=true
gh api \
  --method PATCH \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO" \
  -f squash_merge_commit_title="PR_TITLE" \
  -f squash_merge_commit_message="PR_BODY" \
  --silent
echo "  ✅ Merge settings applied."

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
npm exec -- husky
git config commit.template .gitmessage
echo "  ✅  Git hooks and commit message template configured."

echo "-----------------------------------------------------------------"
echo "⚠️  MANUAL ACTION REQUIRED: GitHub Archive Program"
echo "    The GitHub API does not expose the 'Preserve this repository'"
echo "    toggle. You must enable this manually:"
echo ""
echo "   🔗  https://github.com/$REPO/settings#features"
echo "-----------------------------------------------------------------"
