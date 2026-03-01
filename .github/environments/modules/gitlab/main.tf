resource "github_repository_environment" "gitlab" {
  repository  = var.repository
  environment = "GitLab"

  can_admins_bypass = false

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "gitlab" {
  repository     = var.repository
  environment    = github_repository_environment.gitlab.environment
  branch_pattern = var.default_branch
}

resource "github_actions_environment_secret" "mirror_pat" {
  repository      = var.repository
  environment     = github_repository_environment.gitlab.environment
  secret_name     = "GITLAB_MIRROR_PAT"
  plaintext_value = var.mirror_pat
}
