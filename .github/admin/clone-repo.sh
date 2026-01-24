#!/bin/bash

set -ueC
set -o pipefail

# --- Configuration ---
TARGET_ORG="Duncan3142Org"
NEW_REPO_NAME=$(basename "$PWD")
TEMP_BOOTSTRAP_BRANCH="bootstrap"

# --- Visual Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Initializing Child Repository: $NEW_REPO_NAME${NC}"

if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: You are not logged into gh. Run 'gh auth login'.${NC}"
    exit 1
fi

# Pick repo name
echo -e "Proposed Repository Name: ${GREEN}$NEW_REPO_NAME${NC}"
read -p "Is this correct? (Y/n): " confirm
confirm=${confirm:-Y}

if [[ "$confirm" =~ ^[Nn]$ ]]; then
    read -p "Enter the desired repository name: " input_name
    if [[ -n "$input_name" ]]; then
        NEW_REPO_NAME="$input_name"
    else
        echo -e "${RED}Error: No repository name provided. Aborting.${NC}"
        exit 1
    fi
elif [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Error: Invalid input. Please enter 'Y' or 'n'.${NC}"
    exit 1
fi

# Check if Repo Already Exists
echo -e "${BLUE}🔍 Checking if repository $TARGET_ORG/$NEW_REPO_NAME exists...${NC}"
if gh repo view "$TARGET_ORG/$NEW_REPO_NAME" &> /dev/null; then
    echo -e "${RED}❌ Error: Repository '$TARGET_ORG/$NEW_REPO_NAME' already exists!${NC}"
    echo "   Aborting to prevent accidental overwrite."
    exit 1
fi

# Create Empty Repository
echo -e "${BLUE}📦 Creating empty repository on GitHub...${NC}"
gh repo create "$TARGET_ORG/$NEW_REPO_NAME" --public

# Configure Remotes
echo -e "${BLUE}🔗 Configuring remotes...${NC}"
if git remote | grep -q "^origin$"; then
    git remote rename origin template
    echo "   Renamed existing 'origin' to 'template'."
fi
git remote add origin "https://github.com/$TARGET_ORG/$NEW_REPO_NAME.git"

# Side-Load History
echo -e "${BLUE}📤 Pushing history to temporary bootstrap branch...${NC}"
git push origin "HEAD:refs/heads/$TEMP_BOOTSTRAP_BRANCH" --no-tags

# Construct 'main' via API, bypassing rulesets
echo -e "${BLUE}🏗️  Constructing 'main' branch via API...${NC}"
LATEST_SHA=$(git rev-parse HEAD)
gh api "repos/$TARGET_ORG/$NEW_REPO_NAME/git/refs" \
  -f ref="refs/heads/main" \
  -f sha="$LATEST_SHA"

# Set Default Branch to 'main'
echo -e "${BLUE}⚙️  Setting default branch to 'main'...${NC}"
gh repo edit "$TARGET_ORG/$NEW_REPO_NAME" --default-branch "main"

# Cleanup Bootstrap Branch
echo -e "${BLUE}🧹 Cleaning up temporary branch...${NC}"
gh api -X DELETE "repos/$TARGET_ORG/$NEW_REPO_NAME/git/refs/heads/$TEMP_BOOTSTRAP_BRANCH"

# Local Tracking Setup
echo -e "${BLUE}📡 Setting local tracking information...${NC}"
git fetch origin
git branch --set-upstream-to=origin/main main

echo -e "${GREEN}✅ Success! Repository '$TARGET_ORG/$NEW_REPO_NAME' is live.${NC}"
echo -e "   - Local 'main' is tracking origin/main"
echo -e "   - Template is available at remote 'template'"
