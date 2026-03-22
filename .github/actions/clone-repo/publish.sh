#!/bin/bash

#MISE description="Format, commit, create GitHub repository, and push bootstrap branch"

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
#USAGE flag "--template-branch <template-branch>" {
#USAGE   required #true
#USAGE   env "TEMPLATE_BRANCH"
#USAGE   help "Template branch to persist in the new repository"
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
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

repo_owner="${usage_repo_owner:?}"
clone_repo_name="${usage_clone_repo_name:?}"
source_repo_name="${usage_source_repo_name:?}"
template_branch="${usage_template_branch:?}"
github_token="${usage_github_token:?}"
workspace_dir="${usage_workspace_dir:?}"

export GH_TOKEN="$github_token"

cd "$workspace_dir"

default_branch=$(gh api "repos/:owner/:repo" --jq '.default_branch')

# Create empty GitHub repository
echo -e "${BLUE}📦 Creating empty repository on GitHub...${NC}"
gh repo create "$repo_owner/$clone_repo_name" --private

# Add 'clone-of' custom property to new repo
echo -e "${BLUE}🏷️  Adding 'clone-of' property to new repository...${NC}"
current_origin_url="https://github.com/$repo_owner/$source_repo_name"
clone_of_payload=$(jq -n \
  --arg url "$current_origin_url" \
  '{properties: [{property_name: "clone-of", value: $url}]}')
gh api \
  --method PATCH \
  -H "Accept: application/vnd.github+json" \
  "/repos/$repo_owner/$clone_repo_name/properties/values" \
  --input - <<< "$clone_of_payload"

# Add clone remote to local repo (idempotent)
if ! git remote get-url "${clone_repo_name}" &> /dev/null; then
  git remote add "${clone_repo_name}" "https://github.com/$repo_owner/$clone_repo_name.git"
fi

# Push bootstrap branch to new repo and set upstream
echo -e "${BLUE}📤 Pushing to clone bootstrap branch...${NC}"
git push -u "${clone_repo_name}" "HEAD:$template_branch" --no-tags

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
echo -e "   - Clone it with \"gh repo clone $repo_owner/$clone_repo_name\""
