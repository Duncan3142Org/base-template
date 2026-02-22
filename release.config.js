import assert from "node:assert"
import { readFileSync } from "node:fs"
import { env } from "node:process"
import { pathToFileURL, URL } from "node:url"
import { join } from "node:path"

const { RELEASE_CLI_DIR } = env
assert(RELEASE_CLI_DIR, "RELEASE_CLI_DIR is not defined")

const cliDirUrl = pathToFileURL(join(RELEASE_CLI_DIR, "/"))

/**
 * Reads a file from the given path and base URL.
 * @param {string} path - The path to the file to read.
 * @param {URL | string} base - The base URL to resolve the file path against.
 * @returns {string} The contents of the file as a string.
 */
const readFile = (path, base) => readFileSync(new URL(path, base), "utf8")

const commitPartial = readFile("./commit-partial.hbs", cliDirUrl)

/**
 * Extracts the repository path and package name from the package.json file.
 * @returns {{repoPath: string, pkgName: string}} - An object containing the repository path and package name.
 */
const pkgMeta = () => {
	const pkg = JSON.parse(readFile("./package.json", import.meta.url))
	const repoRegex = /^git\+https:\/\/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\.git$/
	// @ts-expect-error - Guaranteed regex match
	const [, repoPath] = repoRegex.exec(pkg.repository.url)
	const [, pkgName] = pkg.name.split("/")
	return { repoPath, pkgName }
}

/**
 * Generates the path to a plugin based on its name.
 * @param {string} name - The name of the plugin.
 * @returns {string} The path to the plugin.
 */
const plugin = (name) => `${RELEASE_CLI_DIR}/node_modules/${name}`

const meta = pkgMeta()

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
				assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
				message: "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}",
			},
		],
		[
			plugin("@semantic-release/github"),
			{
				successComment:
					":tada: This PR is included in version ${nextRelease.version} :tada:\n\nThe release is available on:\n\n- [GitHub release](https://github.com/" +
					meta.repoPath +
					"/releases/tag/${nextRelease.gitTag})\n- [GitHub package](https://github.com/" +
					meta.repoPath +
					"/pkgs/npm/" +
					meta.pkgName +
					")",
			},
		],
	],
}
