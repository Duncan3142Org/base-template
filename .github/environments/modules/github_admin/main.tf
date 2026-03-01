data "github_team" "repo_admin" {
  slug = var.team_slug
}

resource "github_team_repository" "repo_admin" {
  team_id    = data.github_team.repo_admin.id
  repository = var.repository
  permission = "admin"
}

resource "github_repository_environment" "github_admin" {
  repository  = var.repository
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
  repository     = var.repository
  environment    = github_repository_environment.github_admin.environment
  branch_pattern = var.default_branch
}

resource "github_actions_environment_secret" "app_pem_file" {
  repository      = var.repository
  environment     = github_repository_environment.github_admin.environment
  secret_name     = "ADMIN_APP_PEM_FILE"
  plaintext_value = var.app_pem_file
}

resource "github_actions_environment_secret" "terraform_api_token" {
  repository      = var.repository
  environment     = github_repository_environment.github_admin.environment
  secret_name     = "ADMIN_TF_API_TOKEN"
  plaintext_value = var.terraform_api_token
}

resource "github_actions_environment_secret" "terraform_org_api_token" {
  repository      = var.repository
  environment     = github_repository_environment.github_admin.environment
  secret_name     = "ADMIN_TF_ORG_API_TOKEN"
  plaintext_value = var.terraform_org_api_token
}
