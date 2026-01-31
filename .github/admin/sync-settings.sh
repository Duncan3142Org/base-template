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

echo "-----------------------------------------------------------------"
echo "⚠️  MANUAL ACTION REQUIRED: GitHub Archive Program"
echo "    The GitHub API does not expose the 'Preserve this repository'"
echo "    toggle. You must enable this manually:"
echo ""
echo "   🔗  https://github.com/$REPO/settings#features"
echo "-----------------------------------------------------------------"
