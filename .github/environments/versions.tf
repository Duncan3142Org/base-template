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
  # Authentication is handled by Terraform Cloud Variable Sets:
  # - GITHUB_APP_ID
  # - GITHUB_APP_INSTALLATION_ID
  # - GITHUB_APP_PEM_FILE
}
