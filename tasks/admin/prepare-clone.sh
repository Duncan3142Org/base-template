#!/bin/bash

#MISE description "Prepare files for clone repo"
#USAGE arg "<repo_owner_name>" help="Repository owner name"
#USAGE arg "<source_repo_name>" help="Source repository name"
#USAGE arg "<clone_repo_name>" help="New repository name"

set -ueC
set -o pipefail

# --- Visual Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Inputs ---
repo_owner_name=${usage_repo_owner_name:?}
source_repo_name=${usage_source_repo_name:?}
clone_repo_name=${usage_clone_repo_name:?}

# Update package.json
# - Sets name to @duncan3142org/<new-repo-name>
# - Sets repository.url to git+https://github.com/duncan3142org/<new-repo-name>.git
# - Resets version to 0.0.0
# - Updates description
echo -e "${BLUE}🛠️  Updating package.json...${NC}"
jq --arg name "@${repo_owner_name,,}/${clone_repo_name}" \
   --arg url "git+https://github.com/${repo_owner_name}/${clone_repo_name}.git" \
   --arg desc "Service initialized from ${source_repo_name}" \
   '.name = $name | .version = "0.0.0" | .description = $desc | .repository.url = $url' \
   package.json > package.json.tmp && mv package.json.tmp package.json
# Update .devcontainer/devcontainer.json
# - Replace "base-template" with new repo name
echo -e "${BLUE}🛠️  Updating .devcontainer/devcontainer.json...${NC}"
sed -i "s/${source_repo_name}/${clone_repo_name}/g" .devcontainer/devcontainer.json
# Update README.md
# - Replace "base-template" with new repo name
echo -e "${BLUE}📝 Updating README.md...${NC}"
sed -i "s/${source_repo_name}/${clone_repo_name}/g" README.md
# Remove CHANGELOG.md to regenerate
echo -e "${BLUE}🧹 Removing CHANGELOG.md for regeneration...${NC}"
rm CHANGELOG.md
# Install dependencies to regenerate package-lock.json
echo -e "${BLUE}📦 Regenerate package-lock.json...${NC}"
npm install --package-lock-only --ignore-scripts
# Format files
echo -e "${BLUE}🎨 Formatting modified files...${NC}"
mise run format write
# Stage modified files
git add CHANGELOG.md README.md package.json package-lock.json
# Check for unstaged changes
if git status --porcelain | grep -qE '^.[^ ]'; then
  echo -e "   ${RED}Error: Unstaged changes found.${NC}"
  exit 1
fi
# Commit changes
git commit -m "chore: bootstrap repository [no ci]"
echo -e "${GREEN}✅ Repo contents prepared for clone.${NC}"
