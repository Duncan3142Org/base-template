import { readFileSync } from "node:fs"

const commitPartial = readFileSync(
	new URL("./.github/cicd/commit-partial.hbs", import.meta.url),
	"utf8"
)

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"))
const repoRegex = /^git\+https:\/\/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\.git$/
const [, repoPath] = repoRegex.exec(pkg.repository.url)
const [, pkgName] = pkg.name.split("/")

export default {
	branches: ["main"],
	plugins: [
		"@semantic-release/commit-analyzer",
		[
			"@semantic-release/release-notes-generator",
			{
				preset: "conventionalcommits",
				writerOpts: {
					commitPartial,
				},
			},
		],
		[
			"@semantic-release/changelog",
			{
				changelogFile: "CHANGELOG.md",
			},
		],
		"@semantic-release/npm",
		[
			"@semantic-release/git",
			{
				assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
				message: "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}",
			},
		],
		[
			"@semantic-release/github",
			{
				successComment:
					":tada: This PR is included in version ${nextRelease.version} :tada:\n\nThe release is available on:\n\n- [GitHub release](${releases.find(r => r.name === 'github').url})\n- [GitHub package](https://github.com/" +
					repoPath +
					"/pkgs/npm/" +
					pkgName +
					")",
			},
		],
	],
}
