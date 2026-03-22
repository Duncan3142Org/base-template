#!/bin/bash

#MISE description="Validate inputs and required tools for clone-repo action"

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
#USAGE flag "--tf-org-name <tf-org-name>" {
#USAGE   required #true
#USAGE   env "TF_ORG_NAME"
#USAGE   help "Terraform Cloud Organization Name"
#USAGE }

set -ueC
set -o pipefail

# --- Visual Helpers ---
RED='\033[0;31m'
NC='\033[0m' # No Color

repo_owner="${usage_repo_owner:?}"
clone_repo_name="${usage_clone_repo_name:?}"
source_repo_name="${usage_source_repo_name:?}"
tf_org_name="${usage_tf_org_name:?}"

# --- Validate name inputs ---
for name in "$repo_owner" "$clone_repo_name" "$source_repo_name" "$tf_org_name"; do
  if [[ ! "$name" =~ ^[a-zA-Z0-9._-]+$ ]]; then
    echo -e "${RED}Invalid name '${name}'. Only alphanumeric characters, dots, underscores, and hyphens are allowed.${NC}"
    exit 1
  fi
done

# --- Tool checks ---
for tool in gh curl jq yq comby envsubst; do
  if ! command -v "$tool" &> /dev/null; then
    echo -e "${RED}Error: '${tool}' is not installed.${NC}"
    exit 1
  fi
done
