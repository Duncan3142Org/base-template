#!/usr/bin/env bash

#MISE description "Merge default branch of template remote into local template branch"

#USAGE flag "--template-branch <template-branch>" {
#USAGE   env "TEMPLATE_BRANCH"
#USAGE   default "TEMPLATE"
#USAGE   help "Template branch name"
#USAGE }

set -ueC
set -o pipefail

# --- Visual Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Configuration ---
template_remote_name="template"
TEMPLATE_BRANCH="${usage_template_branch:?}"

# --- Checks ---
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: You are not logged into gh. Run 'gh auth login'.${NC}"
    exit 1
fi

# --- Add 'template' remote using 'clone-of' property ---
echo "🔍  Checking for 'clone-of' property to set up template remote..."
# We use :owner/:repo placeholder which gh automatically resolves to current repo
TEMPLATE_URL=$(gh api "repos/:owner/:repo/properties/values" --jq '.[] | select(.property_name == "clone-of") | .value')

if [ -n "$TEMPLATE_URL" ] && [ "$TEMPLATE_URL" != "null" ]; then
  echo "  ✅  Found template source: $TEMPLATE_URL"
  # Get default branch of the template repo
  template_default_branch=$(gh repo view "$TEMPLATE_URL" --json defaultBranchRef --jq '.defaultBranchRef.name')
  # Add remote if it doesn't already exist
  if ! git remote get-url "$template_remote_name" &> /dev/null; then
    git remote add "$template_remote_name" "$TEMPLATE_URL"
  fi
else
  echo "  ⚠️  This repo does not have a 'clone-of' property set."
  echo "      Skipping template sync."
  exit 0
fi

# Assert no uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Error: You have uncommitted changes. Please stash or commit them before running this script.${NC}"
    exit 1
fi

# --- Fetch Remotes ---
echo -e "${BLUE}Fetching remotes...${NC}"
git fetch origin
git fetch "$template_remote_name"

# --- Switch to/Create local 'template' branch ---
if git show-ref --verify --quiet "refs/heads/${TEMPLATE_BRANCH}"; then
    echo -e "${BLUE}Switching to local '${TEMPLATE_BRANCH}' branch...${NC}"
    git checkout "${TEMPLATE_BRANCH}"

    # Fast-forward local TEMPLATE branch with its upstream (origin/TEMPLATE) if tracked
    echo -e "${BLUE}Pulling latest changes from origin...${NC}"
    git pull --ff-only

elif git show-ref --verify --quiet "refs/remotes/origin/${TEMPLATE_BRANCH}"; then
    echo -e "${BLUE}Local '${TEMPLATE_BRANCH}' does not exist, but found on origin.${NC}"
    echo -e "${BLUE}Creating local '${TEMPLATE_BRANCH}' tracking 'origin/${TEMPLATE_BRANCH}'...${NC}"
    git checkout -b "${TEMPLATE_BRANCH}" "origin/${TEMPLATE_BRANCH}"
else
    echo -e "${BLUE}Branch '${TEMPLATE_BRANCH}' not found locally or on origin.${NC}"
    echo -e "${BLUE}Creating '${TEMPLATE_BRANCH}' from '${template_remote_name}/$template_default_branch'...${NC}"
    git checkout -b "${TEMPLATE_BRANCH}" "${template_remote_name}/$template_default_branch"
fi

# --- Merge upstream changes ---
echo -e "${BLUE}Merging '${template_remote_name}/$template_default_branch' into '${TEMPLATE_BRANCH}'...${NC}"
if git merge "${template_remote_name}/$template_default_branch" --no-edit; then
    echo -e "${GREEN}Successfully merged '${template_remote_name}/$template_default_branch' into '${TEMPLATE_BRANCH}'.${NC}"
    git push -u origin "${TEMPLATE_BRANCH}"
    echo -e "${GREEN}Sync complete.${NC}"
else
    echo -e "${RED}Merge conflicts detected!${NC}"
    echo -e "Please resolve the conflicts manually, then run:"
    echo -e "  git add <resolved-files>"
    echo -e "  git commit"
    exit 1
fi
