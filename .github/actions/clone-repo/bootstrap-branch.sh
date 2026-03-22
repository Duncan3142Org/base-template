#!/bin/bash

#MISE description="Validate inputs and create bootstrap branch for cloned repository"

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
#USAGE flag "--github-token <github-token>" {
#USAGE   required #true
#USAGE   env "GH_TOKEN"
#USAGE   help "GitHub token for authentication"
#USAGE }
#USAGE flag "--workspace-dir <workspace-dir>" {
#USAGE   required #true
#USAGE   env "WORKSPACE_DIR"
#USAGE   help "Workspace root directory for git operations"
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
github_token="${usage_github_token:?}"
workspace_dir="${usage_workspace_dir:?}"

export GH_TOKEN="$github_token"

cd "$workspace_dir"

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

echo -e "${GREEN}✅ Bootstrap branch '$bootstrap_branch' created.${NC}"
