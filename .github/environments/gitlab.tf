resource "github_repository_environment" "gitlab" {
  repository  = data.github_repository.repo.name
  environment = "GitLab"

  can_admins_bypass = false

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "gitlab" {
  repository     = data.github_repository.repo.name
  environment    = github_repository_environment.gitlab.environment
  branch_pattern = data.github_repository.repo.default_branch
}

resource "github_actions_environment_secret" "gitlab_mirror_pat" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.gitlab.environment
  secret_name     = "GITLAB_MIRROR_PAT"
  plaintext_value = var.gitlab_mirror_pat
}
