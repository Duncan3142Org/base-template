#!/usr/bin/env node

//MISE description="Create bootstrap branch for cloned repository"

//USAGE flag "--repo-owner <repo-owner>" {
//USAGE   required #true
//USAGE   env "GITHUB_REPOSITORY_OWNER"
//USAGE   help "Repository owner name"
//USAGE }
//USAGE flag "--clone-repo-name <clone-repo-name>" {
//USAGE   required #true
//USAGE   env "CLONE_REPO_NAME"
//USAGE   help "Clone repository name"
//USAGE }
//USAGE flag "--source-repo-name <source-repo-name>" {
//USAGE   required #true
//USAGE   env "SOURCE_REPO_NAME"
//USAGE   help "Source repository name"
//USAGE }
//USAGE flag "--github-token <github-token>" {
//USAGE   required #true
//USAGE   env "GH_TOKEN"
//USAGE   help "GitHub token for authentication"
//USAGE }
//USAGE flag "--workspace-dir <workspace-dir>" {
//USAGE   required #true
//USAGE   env "WORKSPACE_DIR"
//USAGE   help "Workspace root directory for git operations"
//USAGE }

import console from "node:console"
import { env, exit } from "node:process"
import { execa } from "execa"

// --- Visual Helpers ---
const RED = "\x1b[0;31m"
const GREEN = "\x1b[0;32m"
const BLUE = "\x1b[0;34m"
const NC = "\x1b[0m"

// --- Inputs ---
const repoOwner = env.usage_repo_owner
const cloneRepoName = env.usage_clone_repo_name
const workspaceDir = env.usage_workspace_dir

const GH_TOKEN = env.usage_github_token

const $ = execa({ stderr: "inherit", cwd: workspaceDir, env: { GH_TOKEN } })

// Use github cli to get default branch
const { stdout: defaultBranch } = await $`gh api repos/:owner/:repo --jq .default_branch`

// Assert default branch is checked out
const { stdout: currentBranch } = await $`git rev-parse --abbrev-ref HEAD`
if (currentBranch !== defaultBranch) {
	console.error(
		`${RED}Error: This script must be on the '${defaultBranch}' branch. Current branch is '${currentBranch}'.${NC}`
	)
	exit(1)
}

// Assert no uncommitted changes
const { stdout: status } = await $({ lines: true })`git status --porcelain`
if (status.length !== 0) {
	console.error(
		`${RED}Error: You have uncommitted changes. Please run this script with a clean working directory.${NC}`
	)
	exit(1)
}

// Check if clone already exists
console.log(`${BLUE}🔍 Checking if repository ${repoOwner}/${cloneRepoName} exists...${NC}`)
const repoExists = await $`gh repo view ${repoOwner}/${cloneRepoName} --json name`.then(
	() => true,
	() => false
)

if (repoExists) {
	console.error(
		`${RED}❌ Error: Repository '${repoOwner}/${cloneRepoName}' already exists!${NC}`
	)
	console.error("   Aborting.")
	exit(1)
}

// Create bootstrap branch from default branch
const bootstrapBranch = `bootstrap/${cloneRepoName}`
console.log(`${BLUE}🌱 Creating bootstrap branch '${bootstrapBranch}'...${NC}`)
await $({ stdout: "inherit" })`git checkout -b ${bootstrapBranch} ${defaultBranch}`

console.log(`${GREEN}✅ Bootstrap branch '${bootstrapBranch}' created.${NC}`)
