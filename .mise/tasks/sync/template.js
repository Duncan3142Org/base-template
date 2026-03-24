#!/usr/bin/env node

//MISE description="Sync the template branch from upstream"

//USAGE flag "--template-branch <template-branch>" {
//USAGE   env "TEMPLATE_BRANCH"
//USAGE   default "TEMPLATE"
//USAGE   help "Local branch used for template sync"
//USAGE }

import console from "node:console"
import { env, exit } from "node:process"
import { execa } from "execa"

const $ = execa({ stderr: "inherit" })

// --- Visual Helpers ---
const RED = "\x1b[0;31m"
const GREEN = "\x1b[0;32m"
const BLUE = "\x1b[0;34m"
const NC = "\x1b[0m"

// --- Configuration ---
const templateRemoteName = "template"
const TEMPLATE_BRANCH = env.usage_template_branch

// --- Checks ---
await $`gh --version`.catch(() => {
	console.error(`${RED}GitHub CLI (gh) is not installed.${NC} Please install it to continue.`)
	exit(1)
})
await $`gh auth status`.catch(() => {
	console.error(
		`${RED}You are not authenticated with GitHub CLI.${NC} Please run 'gh auth login' to authenticate.`
	)
	exit(1)
})

// --- Add 'template' remote using 'clone-of' property ---
console.log(`🔍  Checking for ${GREEN}'clone-of'${NC} property to set up template remote...`)
const { stdout: cloneOf } =
	await $`gh api repos/:owner/:repo/properties/values --jq ${'.[] | select(.property_name == "clone-of") | .value'}`

const templateUrl = cloneOf?.trim()

if (templateUrl === "" || templateUrl === "null") {
	console.log(`  ⚠️  This repo does not have a ${GREEN}'clone-of'${NC} property set.`)
	console.log("      Skipping template sync.")
	exit(0)
}

console.log(`  ✅  Found template source: ${templateUrl}`)

// Get default branch of the template repo
const { stdout: templateDefaultBranch } =
	await $`gh repo view ${templateUrl} --json defaultBranchRef --jq .defaultBranchRef.name`

// Add remote if it doesn't already exist
await $`git remote get-url ${templateRemoteName}`.catch(
	() => $`git remote add ${templateRemoteName} ${templateUrl}`
)

// Assert no uncommitted changes
const { stdout: status } = await $({
	lines: true,
	stdout: ["pipe", "inherit"],
})`git status --porcelain`
if (status.length !== 0) {
	console.error(
		`${RED}Error: You have uncommitted changes.${NC} Please stash or commit them before running this script.`
	)
	exit(1)
}

// --- Fetch Remotes ---
console.log(`${BLUE}Fetching remotes...${NC}`)
await $({ stdio: "inherit" })`git fetch origin`
await $({ stdio: "inherit" })`git fetch ${templateRemoteName}`

const hasRef = (ref) => $`git show-ref --verify --quiet ${ref}`.catch(() => false)

// --- Switch to / Create local template branch ---
if (await hasRef(`refs/heads/${TEMPLATE_BRANCH}`)) {
	console.log(`${BLUE}Switching to local '${TEMPLATE_BRANCH}' branch...${NC}`)
	await $({ stdio: "inherit" })`git checkout ${TEMPLATE_BRANCH}`

	console.log(`${BLUE}Pulling latest changes from origin...${NC}`)
	await $({ stdio: "inherit" })`git pull --ff-only`
} else if (await hasRef(`refs/remotes/origin/${TEMPLATE_BRANCH}`)) {
	console.log(`${BLUE}Local '${TEMPLATE_BRANCH}' does not exist, but found on origin.${NC}`)
	console.log(
		`${BLUE}Creating local '${TEMPLATE_BRANCH}' tracking 'origin/${TEMPLATE_BRANCH}'...${NC}`
	)
	await $({ stdio: "inherit" })`git checkout -b ${TEMPLATE_BRANCH} origin/${TEMPLATE_BRANCH}`
} else {
	console.log(`${BLUE}Branch '${TEMPLATE_BRANCH}' not found locally or on origin.${NC}`)
	console.log(
		`${BLUE}Creating '${TEMPLATE_BRANCH}' from '${templateRemoteName}/${templateDefaultBranch}'...${NC}`
	)
	await $({
		stdio: "inherit",
	})`git checkout -b ${TEMPLATE_BRANCH} ${templateRemoteName}/${templateDefaultBranch}`
}

const merge = (ref) =>
	$({ stdio: "inherit" })`git merge ${ref} --no-edit`.catch(({ exitCode }) => {
		console.error("Resolve conflicts, then run: git add <files> && git commit")
		exit(exitCode)
	})

// --- Merge origin/main into template branch ---
console.log(
	`${BLUE}Merging 'origin/main' into '${TEMPLATE_BRANCH}' to ensure it's up to date...${NC}`
)
await merge("origin/main")
console.log(`${GREEN}Successfully merged 'origin/main' into '${TEMPLATE_BRANCH}'.${NC}`)

// --- Merge upstream changes ---
const upstreamRef = `${templateRemoteName}/${templateDefaultBranch}`
console.log(`${BLUE}Merging '${upstreamRef}' into '${TEMPLATE_BRANCH}'...${NC}`)
await merge(upstreamRef)

console.log(`${GREEN}Successfully merged '${upstreamRef}' into '${TEMPLATE_BRANCH}'.${NC}`)
await $({ stdio: "inherit" })`git push -u origin ${TEMPLATE_BRANCH}`
console.log(`${GREEN}Sync complete.${NC}`)
