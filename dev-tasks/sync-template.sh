#!/usr/bin/env bash

#MISE description "Merge main branch of template remote into local template branch"

set -ueC
set -o pipefail

# --- Visual Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Configuration ---
TEMPLATE_REMOTE_NAME="template"
TEMPLATE_BRANCH="${TEMPLATE_BRANCH:-TEMPLATE}"

# --- Checks ---
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: You are not logged into gh. Run 'gh auth login'.${NC}"
    exit 1
fi

# Assert no uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Error: You have uncommitted changes. Please stash or commit them before running this script.${NC}"
    exit 1
fi

# --- 1. Add 'template' remote using 'clone-of' property ---
echo "🔍  Checking for 'clone-of' property to set up template remote..."
TEMPLATE_URL=$(gh api "repos/:owner/:repo/properties/values" --jq '.[] | select(.property_name == "clone-of") | .value')
if [ -n "$TEMPLATE_URL" ] && [ "$TEMPLATE_URL" != "null" ]; then
  echo "  ✅  Found template source: $TEMPLATE_URL"
  git remote add "$TEMPLATE_REMOTE_NAME" "$TEMPLATE_URL"
  git fetch "$TEMPLATE_REMOTE_NAME"
else
  echo "  ⚠️  This repo does not have a 'clone-of' property set."
fi

# --- 2. Fetch template remote ---
echo -e "${BLUE}Fetching '${TEMPLATE_REMOTE_NAME}' remote...${NC}"
git fetch "$TEMPLATE_REMOTE_NAME"

# --- 3. Merge/Create local 'template' branch ---
if git show-ref --verify --quiet "refs/heads/${TEMPLATE_BRANCH}"; then
    echo -e "${BLUE}Switching to local '${TEMPLATE_BRANCH}' branch...${NC}"
    git checkout "${TEMPLATE_BRANCH}"

    echo -e "${BLUE}Merging '${TEMPLATE_REMOTE_NAME}/main' into '${TEMPLATE_BRANCH}'...${NC}"
    git merge "${TEMPLATE_REMOTE_NAME}/main"
    echo -e "${GREEN}Successfully merged '${TEMPLATE_REMOTE_NAME}/main' into '${TEMPLATE_BRANCH}'.${NC}"
else
    echo -e "${BLUE}Local '${TEMPLATE_BRANCH}' branch does not exist. Creating it from '${TEMPLATE_REMOTE_NAME}/main'...${NC}"
    git checkout -b "${TEMPLATE_BRANCH}" "${TEMPLATE_REMOTE_NAME}/main"
    echo -e "${GREEN}Created '${TEMPLATE_BRANCH}' branch tracking '${TEMPLATE_REMOTE_NAME}/main'.${NC}"
fi

echo -e ""
echo -e "${GREEN}Sync complete.${NC}"
echo -e "You are now on the '${TEMPLATE_BRANCH}' branch with the latest changes from the source template."
echo -e "To merge these updates into your main branch, run:"
echo -e "  git checkout main"
echo -e "  git merge ${TEMPLATE_BRANCH}"
