data "github_repository" "repo" {
  full_name = "${var.github_repository_owner}/${var.github_repository_name}"
}

locals {
  environments = toset(["GitHub", "GitHubAdmin", "GitLab"])
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

resource "github_actions_environment_secret" "github_delivery_app_pem_file" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.this["GitHub"].environment
  secret_name     = "DELIVERY_APP_PEM_FILE"
  plaintext_value = var.github_delivery_app_pem_file
}

resource "github_actions_environment_secret" "github_admin_app_pem_file" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.this["GitHubAdmin"].environment
  secret_name     = "ADMIN_APP_PEM_FILE"
  plaintext_value = var.github_admin_app_pem_file
}

resource "github_actions_environment_secret" "github_admin_terraform_api_token" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.this["GitHubAdmin"].environment
  secret_name     = "ADMIN_TERRAFORM_API_TOKEN"
  plaintext_value = var.github_admin_terraform_api_token
}

resource "github_actions_environment_secret" "gitlab_mirror_pat" {
  repository      = data.github_repository.repo.name
  environment     = github_repository_environment.this["GitLab"].environment
  secret_name     = "GITLAB_MIRROR_PAT"
  plaintext_value = var.gitlab_mirror_pat
}
