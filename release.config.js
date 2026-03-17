import { createReleaseConfig } from "./.github/actions/release/release.config.js"

export default createReleaseConfig({
	assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
	branchConfig: {
		major: true,
	},
})
