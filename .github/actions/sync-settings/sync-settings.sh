#!/bin/bash

set -ueC
set -o pipefail

# Visual Helpers
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍  Syncing settings for ${BLUE}'$GITHUB_REPO_OWNER/$GITHUB_REPO_NAME'${NC}..."

# --- Tool checks ---
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
  exit 1
fi

if ! command -v terraform &> /dev/null; then
  echo -e "${RED}Error: Terraform CLI (terraform) is not installed.${NC}"
  exit 1
fi

echo -e "🌍  ${BLUE}Syncing environments...${NC}"
(
  export TF_WORKSPACE="$GITHUB_REPO_NAME-github-repo"
  cd "$WORKSPACE_DIR/$ENVIRONMENTS_WORKSPACE_DIR"
  echo -e "📦  ${BLUE}Using Terraform workspace: $TF_WORKSPACE${NC}"
  echo -e "⚙️  ${BLUE}Initializing Terraform...${NC}"
  terraform init
  echo -e "🚀  ${BLUE}Applying Terraform configuration...${NC}"
  terraform apply -auto-approve
  echo -e "✅  ${BLUE}Environments synced successfully.${NC}"
)

# Pull request settings
echo "⚙️  Syncing PR settings..."
gh api \
  --method PATCH \
  -H "Accept: application/vnd.github+json" \
  "/repos/$GITHUB_REPO_OWNER/$GITHUB_REPO_NAME" \
  -F allow_rebase_merge=false \
  -F allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_auto_merge=true \
  -F delete_branch_on_merge=true \
  -F allow_update_branch=true \
  -f squash_merge_commit_title="PR_TITLE" \
  -f squash_merge_commit_message="PR_BODY" \
  --silent
echo "  ✅ PR settings applied."

echo "---------------------------------------------------------------------------------"
echo "⚠️     MANUAL ACTION REQUIRED: GitHub Archive Program"
echo "       The GitHub API does not expose the 'Preserve this repository'"
echo "       toggle. You must enable this manually:"
echo ""
echo "   🔗  https://github.com/$GITHUB_REPO_OWNER/$GITHUB_REPO_NAME/settings#features"
echo "---------------------------------------------------------------------------------"
