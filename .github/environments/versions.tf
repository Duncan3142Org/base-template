terraform {
  required_version = ">= 1.0"

  cloud {
    organization = "duncan3142"
    workspaces {
      name = "base-template"
    }
  }

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.10"
    }
  }
}

provider "github" {
  owner = var.repository_owner
  app_auth {
    id              = var.github_app_id
    installation_id = var.github_app_installation_id
    pem_file        = var.github_app_pem_file
  }
}
