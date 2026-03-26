#!/usr/bin/env node

//MISE description="Format, commit, create GitHub repository, and push bootstrap branch"

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
//USAGE flag "--template-branch <template-branch>" {
//USAGE   required #true
//USAGE   env "TEMPLATE_BRANCH"
//USAGE   help "Template branch to persist in the new repository"
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
import { env, chdir } from "node:process"
import { execa } from "execa"

// --- Visual Helpers ---
const GREEN = "\x1b[0;32m"
const BLUE = "\x1b[0;34m"
const NC = "\x1b[0m"

// --- Inputs ---
const repoOwner = env.usage_repo_owner
const cloneRepoName = env.usage_clone_repo_name
const sourceRepoName = env.usage_source_repo_name
const templateBranch = env.usage_template_branch
const workspaceDir = env.usage_workspace_dir

const GH_TOKEN = env.usage_github_token

chdir(workspaceDir)
const $ = execa({ stderr: "inherit", env: { GH_TOKEN }, cwd: workspaceDir })

const { stdout: defaultBranch } = await $`gh api repos/:owner/:repo --jq .default_branch`

// Create empty GitHub repository
console.log(`${BLUE}📦 Creating empty repository on GitHub...${NC}`)
await $({ stdout: "inherit" })`gh repo create ${repoOwner}/${cloneRepoName} --private`

// Add 'clone-of' custom property to new repo
console.log(`${BLUE}🏷️  Adding 'clone-of' property to new repository...${NC}`)
const currentOriginUrl = `https://github.com/${repoOwner}/${sourceRepoName}`
const cloneOfPayload = JSON.stringify({
	properties: [{ property_name: "clone-of", value: currentOriginUrl }],
})
await $({
	input: cloneOfPayload,
})`gh api --method PATCH -H ${"Accept: application/vnd.github+json"} /repos/${repoOwner}/${cloneRepoName}/properties/values --input -`

// Add clone remote to local repo (idempotent)
await $`git remote get-url ${cloneRepoName}`.catch(
	() => $`git remote add ${cloneRepoName} https://github.com/${repoOwner}/${cloneRepoName}.git`
)

// Push bootstrap branch to new repo and set upstream
console.log(`${BLUE}📤 Pushing to clone bootstrap branch...${NC}`)
await $({
	stdout: "inherit",
})`git push -u ${cloneRepoName} HEAD:${templateBranch} --no-tags`

// Construct remote default branch via API, bypassing rulesets
console.log(`${BLUE}🏗️  Constructing '${defaultBranch}' branch via API...${NC}`)
const { stdout: latestSha } = await $`git rev-parse HEAD`
await $`gh api repos/${repoOwner}/${cloneRepoName}/git/refs -f ref=${`refs/heads/${defaultBranch}`} -f sha=${latestSha}`

// Set remote default branch to default branch
console.log(`${BLUE}⚙️  Setting default branch to '${defaultBranch}'...${NC}`)
await $({
	stdout: "inherit",
})`gh repo edit ${repoOwner}/${cloneRepoName} --default-branch ${defaultBranch}`

console.log(`${GREEN}✅ Success! Repository '${repoOwner}/${cloneRepoName}' is live.${NC}`)
console.log(`   - Clone it with "gh repo clone ${repoOwner}/${cloneRepoName}"`)
