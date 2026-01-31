data "github_repository" "repo" {
  full_name = "${var.repository_owner}/${var.repository_name}"
}

locals {
  environments = toset(["GitHub", "GitLab"])
}

resource "github_repository_environment" "this" {
  for_each    = local.environments
  repository  = data.github_repository.repo.name
  environment = each.key

  can_admins_bypass = false

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "main" {
  for_each       = local.environments
  repository     = data.github_repository.repo.name
  environment    = github_repository_environment.this[each.key].environment
  branch_pattern = data.github_repository.repo.default_branch
}

resource "github_actions_environment_secret" "deployment_app_secret" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.this["GitHub"].environment
  secret_name     = "DEPLOYMENT_APP_SECRET"
  plaintext_value = var.deployment_app_secret
}

resource "github_actions_environment_secret" "gitlab_mirror_pat" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.this["GitLab"].environment
  secret_name     = "GITLAB_MIRROR_PAT"
  plaintext_value = var.gitlab_mirror_pat
}
