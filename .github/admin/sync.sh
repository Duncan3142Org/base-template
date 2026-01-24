#!/usr/bin/env bash

#MISE description "Sync repo configurations and settings"

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

# Repository settings
echo "⚙️  Enforcing repository standards..."
gh repo edit "$REPO" \
    --enable-rebase-merge=false \
    --enable-squash-merge=true \
    --enable-merge-commit=false \
    --enable-auto-merge=true \
    --delete-branch-on-merge=true \
    --allow-update-branch=true
# Squash Message
gh api \
  --method PATCH \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO" \
  -f squash_merge_commit_title="PR_TITLE" \
  -f squash_merge_commit_message="PR_BODY" \
  --silent
echo "  ✅ Merge settings applied."

# Configure environments
echo "⚙️  Configuring repository environments..."
configure_environment() {
  local env_name="$1"
  echo "  🌍  Configuring Environment: '$env_name'..."

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

  echo "  ✅  Environment configured."
}

configure_environment "GitHub"
configure_environment "GitLab"

# Set up template remote based on 'clone-of' property
echo "🔍  Checking for 'clone-of' property to set up template remote..."
TEMPLATE_URL=$(gh api "repos/:owner/:repo/properties/values" --jq '.[] | select(.property_name == "clone-of") | .value')
if [ -n "$TEMPLATE_URL" ] && [ "$TEMPLATE_URL" != "null" ]; then
  echo "  ✅  Found template source: $TEMPLATE_URL"
  git remote add template "$TEMPLATE_URL"
  git fetch template
else
  echo "  ⚠️  This repo does not have a 'clone-of' property set."
fi

# Set up Git hooks and commit template
echo "⚙️  Setting up Git hooks and commit template..."
npm exec -- husky
git config commit.template .gitmessage
echo "  ✅  Git hooks and commit template configured."

echo "-----------------------------------------------------------------"
echo "⚠️  MANUAL ACTION REQUIRED: GitHub Archive Program"
echo "    The GitHub API does not expose the 'Preserve this repository'"
echo "    toggle. You must enable this manually:"
echo ""
echo "   🔗  https://github.com/$REPO/settings#features"
echo "-----------------------------------------------------------------"
