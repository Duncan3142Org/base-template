import console from "node:console"
import { execa } from "execa"
import { COLOUR_CODES } from "./colour.js"

/**
 * @typedef {object} CloneOptions
 * @property {string} repoOwner - Repository owner name.
 * @property {string} cloneRepoName - Clone repository name.
 * @property {string} sourceRepoName - Source repository name.
 * @property {string} templateBranch - Template branch to persist in the new repository.
 * @property {string} githubToken - GitHub token for authentication.
 * @property {string} workspaceDir - Workspace root directory for git operations.
 */

/**
 * Creates a GitHub repository from the bootstrap branch and pushes.
 * @param {CloneOptions} options - The options for the clone step.
 */
async function clone({
	repoOwner,
	cloneRepoName,
	sourceRepoName,
	templateBranch,
	githubToken,
	workspaceDir,
}) {
	const $ = execa({ stderr: "inherit", env: { GH_TOKEN: githubToken }, cwd: workspaceDir })

	const { stdout: defaultBranch } = await $`gh api repos/:owner/:repo --jq .default_branch`

	// Create empty GitHub repository
	console.log(`${COLOUR_CODES.BLUE}📦 Creating empty repository on GitHub...${COLOUR_CODES.NC}`)
	await $({ stdout: "inherit" })`gh repo create ${repoOwner}/${cloneRepoName} --private`

	// Add 'clone-of' custom property to new repo
	console.log(
		`${COLOUR_CODES.BLUE}🏷️  Adding 'clone-of' property to new repository...${COLOUR_CODES.NC}`
	)
	const currentOriginUrl = `https://github.com/${repoOwner}/${sourceRepoName}`
	const cloneOfPayload = JSON.stringify({
		properties: [{ property_name: "clone-of", value: currentOriginUrl }],
	})
	await $({
		input: cloneOfPayload,
	})`gh api --method PATCH -H ${"Accept: application/vnd.github+json"} /repos/${repoOwner}/${cloneRepoName}/properties/values --input -`

	// Add clone remote to local repo (idempotent)
	await $`git remote get-url ${cloneRepoName}`.catch(
		() =>
			$`git remote add ${cloneRepoName} https://github.com/${repoOwner}/${cloneRepoName}.git`
	)

	// Push bootstrap branch to new repo and set upstream
	console.log(`${COLOUR_CODES.BLUE}📤 Pushing to clone bootstrap branch...${COLOUR_CODES.NC}`)
	await $({
		stdout: "inherit",
	})`git push -u ${cloneRepoName} HEAD:${templateBranch} --no-tags`

	// Construct remote default branch via API, bypassing rulesets
	console.log(
		`${COLOUR_CODES.BLUE}🏗️  Constructing '${defaultBranch}' branch via API...${COLOUR_CODES.NC}`
	)
	const { stdout: latestSha } = await $`git rev-parse HEAD`
	await $`gh api repos/${repoOwner}/${cloneRepoName}/git/refs -f ref=${`refs/heads/${defaultBranch}`} -f sha=${latestSha}`

	// Set remote default branch to default branch
	console.log(
		`${COLOUR_CODES.BLUE}⚙️  Setting default branch to '${defaultBranch}'...${COLOUR_CODES.NC}`
	)
	await $({
		stdout: "inherit",
	})`gh repo edit ${repoOwner}/${cloneRepoName} --default-branch ${defaultBranch}`

	console.log(
		`${COLOUR_CODES.GREEN}✅ Success! Repository '${repoOwner}/${cloneRepoName}' is live.${COLOUR_CODES.NC}`
	)
	console.log(`   - Clone it with "gh repo clone ${repoOwner}/${cloneRepoName}"`)
}

export { clone }
