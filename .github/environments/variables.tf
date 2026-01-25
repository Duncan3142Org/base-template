variable "repository_owner" {
  type        = string
  description = "The owner of the repository"
}

variable "repository_name" {
  type        = string
  description = "The name of the repository"
}

variable "deployment_app_secret" {
  type        = string
  description = "Secret value for DEPLOYMENT_APP_SECRET in GitHub environment"
  sensitive   = true
}

variable "gitlab_mirror_pat" {
  type        = string
  description = "Secret value for GITLAB_MIRROR_PAT in GitLab environment"
  sensitive   = true
}
