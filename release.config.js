import assert from "node:assert"
import { readFileSync } from "node:fs"
import { env } from "node:process"
import { pathToFileURL } from "node:url"
import { join } from "node:path"

const { RELEASE_CLI_DIR } = env
assert(RELEASE_CLI_DIR, "RELEASE_CLI_DIR is not defined")

const cliDirUrl = pathToFileURL(join(RELEASE_CLI_DIR, "/"))

/**
 * @param {string} path
 * @param {URL} base
 */
const readFile = (path, base) => {
	return readFileSync(new URL(path, base), "utf8")
}

const commitPartial = readFile("./commit-partial.hbs", cliDirUrl)

/**
 * @returns {{repoPath: string, pkgName: string}}
 */
const pkgMeta = () => {
	const pkg = JSON.parse(readFile("./package.json", import.meta.url))
	const repoRegex = /^git\+https:\/\/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\.git$/
	const [, repoPath] = repoRegex.exec(pkg.repository.url)
	const [, pkgName] = pkg.name.split("/")
	return { repoPath, pkgName }
}

/**
 * @param {string} name
 */
const plugin = (name) => {
	return `${RELEASE_CLI_DIR}/node_modules/${name}`
}

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
