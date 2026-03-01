resource "github_repository_environment" "github" {
  repository  = var.repository
  environment = "GitHub"

  can_admins_bypass = false

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "github" {
  repository     = var.repository
  environment    = github_repository_environment.github.environment
  branch_pattern = var.default_branch
}

resource "github_actions_environment_secret" "delivery_app_pem_file" {
  repository      = var.repository
  environment     = github_repository_environment.github.environment
  secret_name     = "DELIVERY_APP_PEM_FILE"
  plaintext_value = var.delivery_app_pem_file
}
