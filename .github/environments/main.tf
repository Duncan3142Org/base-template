data "github_repository" "repo" {
  full_name = "${var.github_repository_owner}/${var.github_repository_name}"
}

module "github" {
  source = "./modules/github"

  repository            = data.github_repository.repo.name
  default_branch        = data.github_repository.repo.default_branch
  delivery_app_pem_file = var.github_delivery_app_pem_file
}

module "github_admin" {
  source = "./modules/github_admin"

  repository              = data.github_repository.repo.name
  default_branch          = data.github_repository.repo.default_branch
  team_slug               = var.github_admin_team_slug
  app_pem_file            = var.github_admin_app_pem_file
  terraform_api_token     = var.github_admin_terraform_api_token
  terraform_org_api_token = var.github_admin_terraform_org_api_token
}

module "gitlab" {
  source = "./modules/gitlab"

  repository     = data.github_repository.repo.name
  default_branch = data.github_repository.repo.default_branch
  mirror_pat     = var.gitlab_mirror_pat
}
