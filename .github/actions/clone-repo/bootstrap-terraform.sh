#!/bin/bash

#MISE description="Bootstrap a Terraform Cloud workspace"

#USAGE flag "--tf-org-token <tf-org-token>" {
#USAGE   required #true
#USAGE   env "TF_ORG_TOKEN"
#USAGE   help "Terraform Org API token"
#USAGE }
#USAGE flag "--tf-project-id <tf-project-id>" {
#USAGE   required #true
#USAGE   env "TF_PROJECT_ID"
#USAGE   help "Terraform Cloud Project ID"
#USAGE }
#USAGE flag "--tf-org-name <tf-org-name>" {
#USAGE   required #true
#USAGE   env "TF_ORG_NAME"
#USAGE   help "Terraform Cloud Organization Name"
#USAGE }
#USAGE flag "--clone-repo-name <clone-repo-name>" {
#USAGE   required #true
#USAGE   env "CLONE_REPO_NAME"
#USAGE   help "Name of the new repository"
#USAGE }

set -ueC
set -o pipefail

# --- Visual Helpers ---
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

tf_org_token="${usage_tf_org_token:?}"
tf_project_id="${usage_tf_project_id:?}"
clone_repo_name="${usage_clone_repo_name:?}"
tf_org_name="${usage_tf_org_name:?}"

tf_workspace_name="${clone_repo_name}-github-repo"
echo -e "${BLUE}☁️  Bootstrapping Terraform Cloud workspace '${tf_workspace_name}'...${NC}"

# Check if workspace exists
tf_workspace_response=$(curl -s -w '\n%{http_code}' \
  --header "Authorization: Bearer $tf_org_token" \
  --header "Content-Type: application/vnd.api+json" \
  "https://app.terraform.io/api/v2/organizations/${tf_org_name}/workspaces/${tf_workspace_name}")
tf_workspace_http_code="${tf_workspace_response##*$'\n'}"

if [[ "$tf_workspace_http_code" == "404" ]]; then
  echo "   Workspace not found. Creating..."

  # Create Workspace
  create_ws_payload=$(jq -n \
    --arg name "$tf_workspace_name" \
    --arg project_id "$tf_project_id" \
    '{data: {type: "workspaces", attributes: {name: $name}, relationships: {project: {data: {type: "projects", id: $project_id}}}}}')

  create_ws_response=$(curl -s -w '\n%{http_code}' -X POST \
    --header "Authorization: Bearer $tf_org_token" \
    --header "Content-Type: application/vnd.api+json" \
    --data "$create_ws_payload" \
    "https://app.terraform.io/api/v2/organizations/${tf_org_name}/workspaces")
  create_ws_http_code="${create_ws_response##*$'\n'}"
  create_ws_body="${create_ws_response%$'\n'*}"

  # Extract new Workspace ID
  tf_workspace_id=$(echo "$create_ws_body" | jq -r '.data.id')

  if [[ -z "$tf_workspace_id" || "$tf_workspace_id" == "null" ]]; then
    echo -e "${RED}❌ Error creating workspace (HTTP $create_ws_http_code): $(echo "$create_ws_body" | jq -r '.errors[0].detail // "unknown error"')${NC}"
    exit 1
  fi
  echo "   ✅ Workspace created (ID: $tf_workspace_id)."

  # Create 'github_repository_name' variable
  echo "   Setting 'github_repository_name' variable..."
  create_var_payload=$(jq -n \
    --arg value "$clone_repo_name" \
    '{data: {type: "vars", attributes: {key: "github_repository_name", value: $value, category: "terraform", hcl: false, sensitive: false}}}')

  create_var_response=$(curl -s -w '\n%{http_code}' -X POST \
    --header "Authorization: Bearer $tf_org_token" \
    --header "Content-Type: application/vnd.api+json" \
    --data "$create_var_payload" \
    "https://app.terraform.io/api/v2/workspaces/${tf_workspace_id}/vars")
  create_var_http_code="${create_var_response##*$'\n'}"
  create_var_body="${create_var_response%$'\n'*}"

  if jq -e '.errors' > /dev/null 2>&1 <<< "$create_var_body"; then
    echo -e "${RED}❌ Error setting variable (HTTP $create_var_http_code): $(echo "$create_var_body" | jq -r '.errors[0].detail // "unknown error"')${NC}"
    exit 1
  fi
  echo "   ✅ Variable set."

elif [[ "$tf_workspace_http_code" == "200" ]]; then
  echo "   Workspace already exists. Skipping creation."
else
  echo -e "${RED}❌ Unexpected response (HTTP $tf_workspace_http_code) when checking workspace.${NC}"
  exit 1
fi
