#!/bin/bash

#MISE description "Clone repo"
#USAGE arg "<repo_name>" help="New repository name"

set -ueC
set -o pipefail

# --- Inputs ---
new_repo_name=${usage_repo_name:?}

# --- Visual Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

 # Tool checks
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: You are not logged into gh. Run 'gh auth login'.${NC}"
    exit 1
fi

# Assert 'main' is checked out
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
		echo -e "${RED}Error: This script must be on the 'main' branch. Current branch is '$CURRENT_BRANCH'.${NC}"
		exit 1
fi

# Assert no uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
		echo -e "${RED}Error: You have uncommitted changes. Please run this script with a clean working directory.${NC}"
		exit 1
fi

# Confirm repo name
echo -e "Confirm target repository name: \"${GREEN}$new_repo_name${NC}\""
read -p -r "Is this correct? (N/y): " confirm
confirm=${confirm:-N}
case "$confirm" in
    [Nn])
        echo -e "${RED}Aborting.${NC}"
        exit 1
        ;;
    [Yy])
        ;;
    *)
        echo -e "${RED}Error: Invalid input. Please enter 'Y' or 'n'.${NC}"
        exit 1
				;;
esac

# Check if clone already exists
echo -e "${BLUE}🔍 Checking if repository $GITHUB_ORG/$new_repo_name exists...${NC}"
if gh repo view "$GITHUB_ORG/$new_repo_name" &> /dev/null; then
    echo -e "${RED}❌ Error: Repository '$GITHUB_ORG/$new_repo_name' already exists!${NC}"
    echo "   Aborting."
    exit 1
fi

# Create bootstrap branch from 'main'
bootstrap_branch="bootstrap/${new_repo_name}"
echo -e "${BLUE}🌱 Creating bootstrap branch '$bootstrap_branch'...${NC}"
git checkout -b "$bootstrap_branch" main

# Update package.json
# - Sets name to @duncan3142org/<new-repo-name>
# - Resets version to 0.0.0
# - Updates description
echo -e "${BLUE}🛠️  Updating package.json...${NC}"
jq --arg name "@${GITHUB_ORG,,}/${new_repo_name}" \
   --arg url "git+https://github.com/${GITHUB_ORG}/${new_repo_name}.git" \
   --arg desc "Service initialized from base-template" \
   '.name = $name | .version = "0.0.0" | .description = $desc | .repository.url = $url' \
   package.json > package.json.tmp && mv package.json.tmp package.json
# Update .devcontainer/devcontainer.json
# - Replace "base-template" with new repo name
echo -e "${BLUE}🛠️  Updating .devcontainer/devcontainer.json...${NC}"
sed -i "s/base-template/${new_repo_name}/g" .devcontainer/devcontainer.json
# Update README.md
# - Replace "base-template" with new repo name
echo -e "${BLUE}📝 Updating README.md...${NC}"
sed -i "s/base-template/${new_repo_name}/g" README.md
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

# Create empty GitHub repository
echo -e "${BLUE}📦 Creating empty repository on GitHub...${NC}"
gh repo create "$GITHUB_ORG/$new_repo_name" --private

# Add 'clone-of' custom property to new repo
echo -e "${BLUE}🏷️  Adding 'clone-of' property to new repository...${NC}"
current_origin_url=$(git remote get-url origin)
gh api \
  --method PATCH \
  -H "Accept: application/vnd.github+json" \
  "/repos/$GITHUB_ORG/$new_repo_name/properties/values" \
  --input - <<< "{
    \"properties\": [
      {
        \"property_name\": \"clone-of\",
        \"value\": \"$current_origin_url\"
      }
    ]
  }"

# Add clone remote to local repo
git remote add "${new_repo_name}" "https://github.com/$GITHUB_ORG/$new_repo_name.git"

# Set bootstrap branch upstream to new repo template branch
git branch --set-upstream-to="${new_repo_name}/$TEMPLATE_BRANCH" "$bootstrap_branch"

# Push bootstrap branch to new repo
echo -e "${BLUE}📤 Pushing to clone bootstrap branch...${NC}"
git push "${new_repo_name}" --no-tags

# Construct remote 'main' branch via API, bypassing rulesets
echo -e "${BLUE}🏗️  Constructing 'main' branch via API...${NC}"
LATEST_SHA=$(git rev-parse HEAD)
gh api "repos/$GITHUB_ORG/$new_repo_name/git/refs" \
  -f ref="refs/heads/main" \
  -f sha="$LATEST_SHA"

# Set remote default branch to 'main'
echo -e "${BLUE}⚙️  Setting default branch to 'main'...${NC}"
gh repo edit "$GITHUB_ORG/$new_repo_name" --default-branch "main"

echo -e "${GREEN}✅ Success! Repository '$GITHUB_ORG/$new_repo_name' is live.${NC}"
echo -e "   - Clone it with \"gh clone $GITHUB_ORG/$new_repo_name\""
