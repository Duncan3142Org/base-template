#!/bin/bash

#MISE description="Sync repository settings"

#USAGE flag "--repo-owner <repo-owner>" {
#USAGE   required #true
#USAGE   env "GITHUB_REPO_OWNER"
#USAGE   help "Repository owner name"
#USAGE }
#USAGE flag "--repo-name <repo-name>" {
#USAGE   required #true
#USAGE   env "GITHUB_REPO_NAME"
#USAGE   help "Repository name"
#USAGE }
#USAGE flag "--environments-workspace-dir <environments-workspace-dir>" {
#USAGE   required #true
#USAGE   env "ENVIRONMENTS_WORKSPACE_DIR"
#USAGE   help "Directory containing environment configuration, relative to repository root"
#USAGE }
#USAGE flag "--workspace-dir <workspace-dir>" {
#USAGE   required #true
#USAGE   env "WORKSPACE_DIR"
#USAGE   help "Workspace directory"
#USAGE }
#USAGE flag "--tf-token <tf-token>" {
#USAGE   env "TF_TOKEN"
#USAGE   help "Terraform API token"
#USAGE }

set -ueC
set -o pipefail

# Visual Helpers
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

repo_owner="${usage_repo_owner:?}"
repo_name="${usage_repo_name:?}"
environments_workspace_dir="${usage_environments_workspace_dir:?}"
workspace_dir="${usage_workspace_dir:?}"
tf_token="${usage_tf_token:-}"

if [[ -n "$tf_token" ]]; then
  export TF_TOKEN_app_terraform_io="$tf_token"
fi

echo "🔍  Syncing settings for ${BLUE}'$repo_owner/$repo_name'${NC}..."

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
  export TF_WORKSPACE="$repo_name-github-repo"
  cd "$workspace_dir/$environments_workspace_dir"
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
  "/repos/$repo_owner/$repo_name" \
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
echo "   🔗  https://github.com/$repo_owner/$repo_name/settings#features"
echo "---------------------------------------------------------------------------------"
