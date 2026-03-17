import assert from "node:assert"
import { execa } from "execa"

/**
 * semantic-release plugin that creates or updates vX and vX.Y branches
 * pointing to the same commit as the release tag.
 *
 * Runs in the "success" lifecycle step — after the vX.Y.Z tag has been
 * pushed and the release is fully complete.
 *
 * Configuration (all optional):
 * major    – push a vX branch          (default: true)
 * minor    – push a vX.Y branch        (default: false)
 * prefix   – branch name prefix        (default: "v")
 *
 * Example .releaserc.json:
 * ["semantic-release-branch-tags", { "major": true, "minor": true }]
 */

/**
 * @import { PublishContext} from "semantic-release"
 */

/**
 * @typedef {object} PluginConfig
 * @property {boolean} [major=true] - Whether to update the major version branch (e.g., v1).
 * @property {boolean} [minor=false] - Whether to update the minor version branch (e.g., v1.2).
 * @property {string} [prefix="v"] - The prefix for the branch names.
 */

/**
 * Pushes the release commit to the specified branches.
 * @param {string[]} branches - The list of branch names to update.
 * @param {string} gitHead - The commit SHA to which the branches should point.
 * @param {string | undefined} repositoryUrl - The URL of the Git repository.
 * @param {PublishContext['logger']} logger - The semantic-release logger for logging messages.
 * @returns {Promise<void>} A promise that resolves when the branches have been pushed.
 */

async function pushBranches(branches, gitHead, repositoryUrl, logger) {
	assert(repositoryUrl, "repositoryUrl is required to push branches")
	if (branches.length === 0) {
		logger.log("No alias branches enabled; skipping branch updates.")
		return
	}

	logger.log(
		`Updating branches ${branches.map((branch) => `"${branch}"`).join(", ")} → ${gitHead.slice(0, 7)}`
	)

	// Push the release commit directly to each remote branch ref.
	// This creates missing branches and updates existing ones without
	// creating or switching local branches in the CI checkout.
	const refspecs = branches.map((branch) => `${gitHead}:refs/heads/${branch}`)
	await execa("git", ["push", repositoryUrl, ...refspecs])

	logger.log(
		`Branches ${branches.map((branch) => `"${branch}"`).join(", ")} pushed successfully.`
	)
}

/**
 * Checks the plugin configuration for validity.
 * @param {PluginConfig} pluginConfig - the plugin configuration object
 * @param {PublishContext} context - the semantic-release context object, containing release information and utilities
 */
async function verifyConditions(pluginConfig, context) {
	// Nothing to verify beyond what core already checks (push access).
	// If the user has misconfigured the options we'll catch it early.
	const { major = true, minor = false } = pluginConfig
	const { logger } = context

	if (!major && !minor) {
		logger.log(
			"Both `major` and `minor` alias branches are disabled; branch updates will be skipped."
		)
	}
}

/**
 * Updates the major and minor branches to point to the release commit.
 * @param {PluginConfig} pluginConfig - the plugin configuration object
 * @param {PublishContext} context - the semantic-release context object, containing release information and utilities
 */
async function success(pluginConfig, context) {
	const {
		nextRelease: { version, gitHead },
		options: { repositoryUrl },
		logger,
	} = context

	const { major = true, minor = false, prefix = "v" } = pluginConfig

	if (!major && !minor) {
		logger.log("Both `major` and `minor` alias branches are disabled; skipping branch updates.")
		return
	}

	// Parse the semver components from the version string.
	// semantic-release guarantees `version` is a valid semver (no leading "v").
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)

	if (!match) {
		logger.log(`Could not parse version "${version}" — skipping branch updates.`)
		return
	}

	const [, majorVersion, minorVersion] = match

	const branches = []

	if (major) {
		branches.push(`${prefix}${majorVersion}`)
	}

	if (minor) {
		branches.push(`${prefix}${majorVersion}.${minorVersion}`)
	}

	await pushBranches(branches, gitHead, repositoryUrl, logger)
}

export { verifyConditions, success }
