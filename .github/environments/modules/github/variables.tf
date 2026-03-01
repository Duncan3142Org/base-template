variable "repository" {
  type        = string
  description = "The name of the repository"
}

variable "default_branch" {
  type        = string
  description = "The default branch of the repository"
}

variable "delivery_app_pem_file" {
  type        = string
  description = "Secret value for DELIVERY_APP_PEM_FILE in GitHub environment"
  sensitive   = true
}
