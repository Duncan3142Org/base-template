import { join } from "node:path"
import process from "node:process"
import { readFileSync } from "node:fs"
import semanticRelease from "semantic-release"
import { root } from "#root"

/** @import { Result } from "semantic-release" */

const packageDir = root()

/**
 * Reads a template file from the templates directory.
 * @param {string} name - The template file name.
 * @returns {string} The file contents.
 */
const readTemplate = (name) => readFileSync(join(packageDir, "templates", name), "utf8")

/**
 * Resolves a plugin specifier to its installed path.
 * @param {string} name - The npm package name of the plugin.
 * @returns {string} Absolute path to the plugin entry point.
 */
const resolvePlugin = (name) => join(packageDir, "node_modules", name)

/**
 * @typedef {object} ReleaseOptions
 * @property {string[]} assets - Files to commit after release.
 * @property {boolean} majorBranch - Update a v/X branch after release.
 * @property {boolean} minorBranch - Update a v/X.Y branch after release.
 * @property {string} branchPrefix - Prefix path for version branches.
 * @property {string[]} branches - Git branches to release from.
 * @property {boolean} dryRun - Run without publishing.
 * @property {string} repoRoot - Current working directory for the release process.
 */

/** @type {ReleaseOptions} */
const DEFAULT_OPTIONS = {
	assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
	majorBranch: false,
	minorBranch: false,
	branchPrefix: "v",
	branches: ["main"],
	dryRun: false,
	repoRoot: process.cwd(),
}

/**
 * Runs semantic-release with opinionated defaults for \@deafrex packages.
 * @param {ReleaseOptions} options - Release configuration options.
 * @returns {Promise<Result>} The release result, or `false` if no release was published.
 */
async function release(options) {
	const commitPartial = readTemplate("commit-partial.hbs")
	const successComment = readTemplate("success-comment.txt")
	const majorBranchPlugin = join(packageDir, "lib", "major-branch-plugin.js")

	const { assets, majorBranch, minorBranch, branchPrefix, branches, dryRun, repoRoot } = options

	return semanticRelease(
		{
			branches,
			dryRun,
			plugins: [
				resolvePlugin("@semantic-release/commit-analyzer"),
				[
					resolvePlugin("@semantic-release/release-notes-generator"),
					{
						writerOpts: {
							commitPartial,
						},
					},
				],
				[
					resolvePlugin("@semantic-release/changelog"),
					{
						changelogFile: "CHANGELOG.md",
					},
				],
				resolvePlugin("@semantic-release/npm"),
				[
					resolvePlugin("@semantic-release/git"),
					{
						assets,
						message: "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}",
					},
				],
				[
					resolvePlugin("@semantic-release/github"),
					{
						successComment,
					},
				],
				[majorBranchPlugin, { major: majorBranch, minor: minorBranch, prefix: branchPrefix }],
			],
		},
		{
			cwd: repoRoot,
		}
	)
}

export { release, DEFAULT_OPTIONS }
