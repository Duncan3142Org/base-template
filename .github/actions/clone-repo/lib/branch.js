import console from "node:console"
import { execa } from "execa"
import { COLOUR_CODES } from "./colour"

/**
 * @typedef {object} BranchOptions
 * @property {string} repoOwner - Repository owner name.
 * @property {string} cloneRepoName - Clone repository name.
 * @property {string} githubToken - GitHub token for authentication.
 * @property {string} workspaceDir - Workspace root directory for git operations.
 */

/**
 * Creates a bootstrap branch for the cloned repository.
 * @param {BranchOptions} options - The options for the branch step.
 */
async function branch({ repoOwner, cloneRepoName, githubToken, workspaceDir }) {
	const $ = execa({ stderr: "inherit", cwd: workspaceDir, env: { GH_TOKEN: githubToken } })

	const { stdout: defaultBranch } = await $`gh api repos/:owner/:repo --jq .default_branch`

	const { stdout: currentBranch } = await $`git rev-parse --abbrev-ref HEAD`
	if (currentBranch !== defaultBranch) {
		throw new Error(
			`${COLOUR_CODES.RED}Error: This script must be on the '${defaultBranch}' branch. Current branch is '${currentBranch}'.${COLOUR_CODES.NC}`
		)
	}

	const { stdout: status } = await $({ lines: true })`git status --porcelain`
	if (status.length !== 0) {
		throw new Error(
			`${COLOUR_CODES.RED}Error: You have uncommitted changes. Please run this script with a clean working directory.${COLOUR_CODES.NC}`
		)
	}

	console.log(
		`${COLOUR_CODES.BLUE}🔍 Checking if repository ${repoOwner}/${cloneRepoName} exists...${COLOUR_CODES.NC}`
	)
	const repoExists = await $`gh repo view ${repoOwner}/${cloneRepoName} --json name`.then(
		() => true,
		() => false
	)

	if (repoExists) {
		throw new Error(
			`${COLOUR_CODES.RED}❌ Error: Repository '${repoOwner}/${cloneRepoName}' already exists!${COLOUR_CODES.NC}`
		)
	}

	const bootstrapBranch = `bootstrap/${cloneRepoName}`
	console.log(
		`${COLOUR_CODES.BLUE}🌱 Creating bootstrap branch '${bootstrapBranch}'...${COLOUR_CODES.NC}`
	)
	await $({ stdout: "inherit" })`git checkout -b ${bootstrapBranch} ${defaultBranch}`

	console.log(
		`${COLOUR_CODES.GREEN}✅ Bootstrap branch '${bootstrapBranch}' created.${COLOUR_CODES.NC}`
	)
}

export { branch }
