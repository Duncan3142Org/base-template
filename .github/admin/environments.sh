#!/bin/bash

#MISE description "Sync environments using Terraform"

set -ueC
set -o pipefail

# Visual Helpers
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "🌍  ${BLUE}Syncing environments via Terraform...${NC}"

# Ensure Terraform is initialized
echo -e "⚙️  ${BLUE}Initializing Terraform...${NC}"
terraform init

# Apply changes
echo -e "🚀  ${BLUE}Applying Terraform configuration...${NC}"
terraform apply

echo -e "✅  ${BLUE}Environments synced successfully.${NC}"
