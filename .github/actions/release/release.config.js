import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { env } from "node:process"

const {
	RELEASE_PLUGIN_DIR = dirname(fileURLToPath(import.meta.url)),
	RELEASE_ASSETS,
	RELEASE_MAJOR_BRANCH = "false",
	RELEASE_MINOR_BRANCH = "false",
	RELEASE_BRANCH_PREFIX = "v",
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

/**
 * Parses the RELEASE_ASSETS env var as a JSON array of strings.
 * @param {string | undefined} raw - The raw env var value.
 * @returns {string[]} The parsed assets array.
 */
function parseAssets(raw) {
	if (!raw) {
		return defaultAssets
	}

	const parse = () => {
		try {
			return JSON.parse(raw)
		} catch {
			throw new Error(`RELEASE_ASSETS is not valid JSON: ${raw}`)
		}
	}
	const parsed = parse()

	if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
		throw new Error(`RELEASE_ASSETS must be a JSON array of strings: ${raw}`)
	}
	return parsed
}

const assets = parseAssets(RELEASE_ASSETS)
const majorBranchOptions = {
	major: RELEASE_MAJOR_BRANCH === "true",
	minor: RELEASE_MINOR_BRANCH === "true",
	prefix: RELEASE_BRANCH_PREFIX,
}

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
		[majorBranchPlugin, majorBranchOptions],
	],
}
