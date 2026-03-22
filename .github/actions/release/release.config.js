import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { env } from "node:process"

/**
 * @import {PluginConfig as MajorBranchConfig } from "./major-branch.js"
 */

const { RELEASE_PLUGIN_DIR = dirname(fileURLToPath(import.meta.url)) } = env

const releaseCliDir = RELEASE_PLUGIN_DIR

/**
 * Reads a file from the release action directory.
 * @param {string} path - The path to the file to read.
 * @returns {string} The contents of the file as a string.
 */
const readFile = (path) => readFileSync(join(releaseCliDir, path), "utf8")

const commitPartial = readFile("commit-partial.hbs")
const successComment = readFile("success-comment.txt")
const majorBranchPlugin = join(releaseCliDir, "major-branch.js")
const defaultAssets = ["CHANGELOG.md", "package.json", "package-lock.json"]

/**
 * Generates the path to a plugin based on its name.
 * @param {string} name - The name of the plugin.
 * @returns {string} The path to the plugin.
 */
const plugin = (name) => join(releaseCliDir, "node_modules", name)

/**
 * @typedef {object} ReleaseConfigOptions
 * @property {string[]} [assets=defaultAssets] - Files committed by the git plugin after release.
 * @property {MajorBranchConfig} [branchConfig] - Configuration passed to the major branch plugin.
 */

/**
 * Creates semantic-release configuration for this action.
 * @param {ReleaseConfigOptions} [options] - Repo-specific release config options.
 * @returns {{branches: string[], plugins: unknown[]}} Semantic-release configuration.
 */
export function createReleaseConfig(options = {}) {
	const { assets = defaultAssets, branchConfig = {} } = options

	return {
		branches: ["main"],
		plugins: [
			plugin("@semantic-release/commit-analyzer"),
			[
				plugin("@semantic-release/release-notes-generator"),
				{
					writerOpts: {
						commitPartial,
					},
				},
			],
			[
				plugin("@semantic-release/changelog"),
				{
					changelogFile: "CHANGELOG.md",
				},
			],
			plugin("@semantic-release/npm"),
			[
				plugin("@semantic-release/git"),
				{
					assets,
					message: "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}",
				},
			],
			[
				plugin("@semantic-release/github"),
				{
					successComment,
				},
			],
			[majorBranchPlugin, branchConfig],
		],
	}
}
