#!/bin/bash

#MISE description="Clone a repository from template"

#USAGE flag "--repo-owner <repo-owner>" {
#USAGE   required #true
#USAGE   env "GITHUB_REPOSITORY_OWNER"
#USAGE   help "Repository owner name"
#USAGE }
#USAGE flag "--clone-repo-name <clone-repo-name>" {
#USAGE   required #true
#USAGE   env "CLONE_REPO_NAME"
#USAGE   help "Clone repository name"
#USAGE }
#USAGE flag "--source-repo-name <source-repo-name>" {
#USAGE   required #true
#USAGE   env "SOURCE_REPO_NAME"
#USAGE   help "Source repository name"
#USAGE }
#USAGE flag "--workspace-dir <workspace-dir>" {
#USAGE   required #true
#USAGE   env "GITHUB_WORKSPACE"
#USAGE   help "GitHub workspace directory"
#USAGE }
#USAGE flag "--environments-workspace-dir <environments-workspace-dir>" {
#USAGE   default "./.github/environments"
#USAGE   env "ENVIRONMENTS_WORKSPACE_DIR"
#USAGE   help "Directory containing environment configuration, relative to repository root"
#USAGE }
#USAGE flag "--template-branch <template-branch>" {
#USAGE   default "TEMPLATE"
#USAGE   env "TEMPLATE_BRANCH"
#USAGE   help "Template branch to use for the clone"
#USAGE }

set -ueC
set -o pipefail

# --- Visual Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

repo_owner="${usage_repo_owner:?}"
clone_repo_name="${usage_clone_repo_name:?}"
source_repo_name="${usage_source_repo_name:?}"
environments_workspace_dir="${usage_environments_workspace_dir:?}"
workspace_dir="${usage_workspace_dir:?}"
template_branch="${usage_template_branch:?}"

# --- Validate Inputs ---
if [[ ! "${clone_repo_name}" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Invalid repository name. Only alphanumeric characters, underscores, and hyphens are allowed."
  exit 1
fi

mise run install

# Tool checks
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
  exit 1
fi

if ! command -v terraform &> /dev/null; then
  echo -e "${RED}Error: Terraform CLI (terraform) is not installed.${NC}"
  exit 1
fi

# Check that terraform cloud workspace exists before proceeding
echo -e "${BLUE}🔧 Ensuring Terraform Cloud workspace exists...${NC}"
(
  cd "$workspace_dir/$environments_workspace_dir"
  export TF_WORKSPACE="$clone_repo_name-github-repo"
  terraform init
)

# Use github cli to get default branch
default_branch=$(gh api "repos/:owner/:repo" --jq '.default_branch')

# Assert default branch is checked out
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "$default_branch" ]]; then
  echo -e "${RED}Error: This script must be on the '$default_branch' branch. Current branch is '$current_branch'.${NC}"
  exit 1
fi

# Assert no uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${RED}Error: You have uncommitted changes. Please run this script with a clean working directory.${NC}"
  exit 1
fi

# Check if clone already exists
echo -e "${BLUE}🔍 Checking if repository $repo_owner/$clone_repo_name exists...${NC}"
if gh repo view "$repo_owner/$clone_repo_name" &> /dev/null; then
  echo -e "${RED}❌ Error: Repository '$repo_owner/$clone_repo_name' already exists!${NC}"
  echo "   Aborting."
  exit 1
fi

# Create bootstrap branch from default branch
bootstrap_branch="bootstrap/${clone_repo_name}"
echo -e "${BLUE}🌱 Creating bootstrap branch '$bootstrap_branch'...${NC}"
git checkout -b "$bootstrap_branch" "$default_branch"

# Prepare files for clone
echo -e "${BLUE}🛠️  Preparing files for clone...${NC}"
mise run prepare-clone "$repo_owner" "$source_repo_name" "$clone_repo_name"

# Create empty GitHub repository
echo -e "${BLUE}📦 Creating empty repository on GitHub...${NC}"
gh repo create "$repo_owner/$clone_repo_name" --private

# Add 'clone-of' custom property to new repo
echo -e "${BLUE}🏷️  Adding 'clone-of' property to new repository...${NC}"
current_origin_url=$(git remote get-url origin)
gh api \
  --method PATCH \
  -H "Accept: application/vnd.github+json" \
  "/repos/$repo_owner/$clone_repo_name/properties/values" \
  --input - <<< "{
    \"properties\": [
      {
        \"property_name\": \"clone-of\",
        \"value\": \"$current_origin_url\"
      }
    ]
  }"

# Add clone remote to local repo
git remote add "${clone_repo_name}" "https://github.com/$repo_owner/$clone_repo_name.git"

# Set bootstrap branch upstream to new repo template branch
git branch --set-upstream-to="${clone_repo_name}/$template_branch" "$bootstrap_branch"

# Push bootstrap branch to new repo
echo -e "${BLUE}📤 Pushing to clone bootstrap branch...${NC}"
git push "${clone_repo_name}" --no-tags

# Construct remote default branch via API, bypassing rulesets
echo -e "${BLUE}🏗️  Constructing '$default_branch' branch via API...${NC}"
latest_sha=$(git rev-parse HEAD)
gh api "repos/$repo_owner/$clone_repo_name/git/refs" \
  -f ref="refs/heads/$default_branch" \
  -f sha="$latest_sha"

# Set remote default branch to default branch
echo -e "${BLUE}⚙️  Setting default branch to '$default_branch'...${NC}"
gh repo edit "$repo_owner/$clone_repo_name" --default-branch "$default_branch"

echo -e "${GREEN}✅ Success! Repository '$repo_owner/$clone_repo_name' is live.${NC}"
echo -e "   - Clone it with \"gh clone $repo_owner/$clone_repo_name\""
