variable "repository" {
  type        = string
  description = "The name of the repository"
}

variable "default_branch" {
  type        = string
  description = "The default branch of the repository"
}

variable "team_slug" {
  type        = string
  description = "The slug of the team that can review deployments"
}

variable "app_pem_file" {
  type        = string
  description = "Secret value for ADMIN_APP_PEM_FILE in GitHubAdmin environment"
  sensitive   = true
}

variable "terraform_api_token" {
  type        = string
  description = "Secret value for ADMIN_TF_API_TOKEN in GitHubAdmin environment"
  sensitive   = true
}

variable "terraform_org_api_token" {
  type        = string
  description = "Secret value for ADMIN_TF_ORG_API_TOKEN in GitHubAdmin environment"
  sensitive   = true
}
