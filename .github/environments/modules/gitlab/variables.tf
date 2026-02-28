variable "repository" {
  type        = string
  description = "The name of the repository"
}

variable "default_branch" {
  type        = string
  description = "The default branch of the repository"
}

variable "mirror_pat" {
  type        = string
  description = "Secret value for GITLAB_MIRROR_PAT in GitLab environment"
  sensitive   = true
}
