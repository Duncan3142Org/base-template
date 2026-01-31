import { readFileSync } from "node:fs"

const commitPartial = readFileSync(
	new URL("./.github/cicd/commit-partial.hbs", import.meta.url),
	"utf8"
)

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
		"@semantic-release/github",
	],
}
