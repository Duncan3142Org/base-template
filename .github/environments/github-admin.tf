data "github_team" "repo_admin" {
  slug = "github-repo-admin"
}

resource "github_repository_environment" "github_admin" {
  repository  = data.github_repository.repo.name
  environment = "GitHubAdmin"

  reviewers {
    teams = [data.github_team.repo_admin.id]
  }
  prevent_self_review = false
  can_admins_bypass   = false

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "github_admin" {
  repository     = data.github_repository.repo.name
  environment    = github_repository_environment.github_admin.environment
  branch_pattern = data.github_repository.repo.default_branch
}

resource "github_actions_environment_secret" "github_admin_app_pem_file" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.github_admin.environment
  secret_name     = "ADMIN_APP_PEM_FILE"
  plaintext_value = var.github_admin_app_pem_file
}

resource "github_actions_environment_secret" "github_admin_terraform_api_token" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.github_admin.environment
  secret_name     = "ADMIN_TERRAFORM_API_TOKEN"
  plaintext_value = var.github_admin_terraform_api_token
}
