resource "github_repository_environment" "github" {
  repository  = data.github_repository.repo.name
  environment = "GitHub"

  can_admins_bypass = false

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "github" {
  repository     = data.github_repository.repo.name
  environment    = github_repository_environment.github.environment
  branch_pattern = data.github_repository.repo.default_branch
}

resource "github_actions_environment_secret" "github_delivery_app_pem_file" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.github.environment
  secret_name     = "DELIVERY_APP_PEM_FILE"
  plaintext_value = var.github_delivery_app_pem_file
}
