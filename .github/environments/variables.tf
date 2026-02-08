variable "github_repository_owner" {
  type        = string
  description = "The owner of the repository"
}

variable "github_repository_name" {
  type        = string
  description = "The name of the repository"
}

variable "github_delivery_app_pem_file" {
  type        = string
  description = "Secret value for DELIVERY_APP_PEM_FILE in GitHub environment"
  sensitive   = true
}

variable "gitlab_mirror_pat" {
  type        = string
  description = "Secret value for GITLAB_MIRROR_PAT in GitLab environment"
  sensitive   = true
}

variable "github_admin_app_id" {
  type        = string
  description = "The GitHub Admin App ID"
}

variable "github_admin_app_installation_id" {
  type        = string
  description = "The GitHub Admin App Installation ID"
}

variable "github_admin_app_pem_file" {
  type        = string
  description = "Secret value for Terraform GitHub provider auth and ADMIN_APP_PEM_FILE in GitHubAdmin environment"
  sensitive   = true
}

variable "github_admin_terraform_api_token" {
  type        = string
  description = "Secret value for ADMIN_TERRAFORM_API_TOKEN in GitHubAdmin environment"
  sensitive   = true
}

variable "github_admin_terraform_org_api_token" {
  type        = string
  description = "Secret value for ADMIN_TERRAFORM_ORG_API_TOKEN in GitHubAdmin environment"
  sensitive   = true
}
