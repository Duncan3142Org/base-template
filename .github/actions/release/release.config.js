import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { env } from "node:process"

const {
	RELEASE_PLUGIN_DIR = dirname(fileURLToPath(import.meta.url)),
	RELEASE_ASSETS,
	RELEASE_MAJOR = "false",
	RELEASE_MINOR = "false",
	RELEASE_PREFIX = "v",
} = env

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

const assets = RELEASE_ASSETS ? JSON.parse(RELEASE_ASSETS) : defaultAssets

/**
 * Generates the path to a plugin based on its name.
 * @param {string} name - The name of the plugin.
 * @returns {string} The path to the plugin.
 */
const plugin = (name) => join(releaseCliDir, "node_modules", name)

export default {
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
		[
			majorBranchPlugin,
			{
				major: RELEASE_MAJOR === "true",
				minor: RELEASE_MINOR === "true",
				prefix: RELEASE_PREFIX,
			},
		],
	],
}
