#!/usr/bin/env bash

set -ueC
set -o pipefail

# ==============================================================================
# Script: configure-github-repo.sh
# Purpose: Enforces Engineering Standards on GitHub Repositories
# Usage: Executed via Mise task
# ==============================================================================

if ! command -v gh &> /dev/null; then
  echo "❌ Error: GitHub CLI (gh) is not installed." >&2
  exit 1
fi

echo "🔍 Resolving repository from local git context..."
if ! REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null); then
  echo "❌ Error: Could not detect GitHub repository in the current directory." >&2
  exit 1
fi
echo "🎯 Target Repository: $REPO"

echo "⚙️  Enforcing repository standards..."
gh repo edit "$REPO" \
    --enable-rebase-merge=false \
    --enable-squash-merge=true \
    --enable-merge-commit=false \
    --enable-auto-merge=true \
    --delete-branch-on-merge=true \
    --allow-update-branch=true
echo "   ✅ Merge settings applied."

configure_environment() {
  local env_name="$1"
  echo "🌍 Configuring Environment: '$env_name'..."

  # Create/update environment with settings
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$REPO/environments/$env_name" \
    --silent \
    --input - <<EOF
{
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": true
  },
  "can_admins_bypass": false
}
EOF

  local existing_policies
  existing_policies=$(gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$REPO/environments/$env_name/deployment-branch-policies" \
    --jq '.[].name' 2>/dev/null || echo "")

  if ! echo "$existing_policies" | grep -q "^main$"; then
    gh api \
      --method POST \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "/repos/$REPO/environments/$env_name/deployment-branch-policies" \
      -f name="main" \
      --silent
  fi

  echo "   ✅ Environment configured."
}

configure_environment "GitHub"
configure_environment "GitLab"


TEMPLATE_URL=$(gh repo view "$REPO" --json templateRepository --jq '.templateRepository.url')
if [[ -n "$TEMPLATE_URL" && "$TEMPLATE_URL" != "null" ]]; then
  TEMPLATE_REMOTE_NAME="template"
  git remote add "$TEMPLATE_REMOTE_NAME" "$TEMPLATE_URL" 2>/dev/null || true
  echo "   ✅ Remote '$TEMPLATE_REMOTE_NAME' configured -> $TEMPLATE_URL"
else
  echo "   ℹ️  Skipping: This repository is not linked to a GitHub Template."
fi

echo "----------------------------------------------------------------"
echo "⚠️  MANUAL ACTION REQUIRED: GitHub Archive Program"
echo "   The GitHub API does not expose the 'Preserve this repository'"
echo "   toggle. You must enable this manually:"
echo ""
echo "   🔗 https://github.com/$REPO/settings"
echo "----------------------------------------------------------------"

npm exec -- husky
git config commit.template .gitmessage
echo "✅ Git hooks and commit template configured."
