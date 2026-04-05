#!/usr/bin/env node

import process, { env } from "node:process"
import console from "node:console"
import { parseArgs } from "node:util"
import { syncSettings } from "#lib"

const { values } = parseArgs({
	options: {
		"repo-owner": {
			type: "string",
			short: "o",
			description: "Repository owner name",
			default: env.GITHUB_REPOSITORY_OWNER,
		},
		"repo-name": {
			type: "string",
			short: "n",
			description: "Repository name",
		},
		"environments-workspace-dir": {
			type: "string",
			short: "d",
			description:
				"Directory containing environment configuration, relative to repository root",
			default: "./.github/environments",
		},
		"tf-token": {
			type: "string",
			description: "Terraform API token",
		},
		"github-token": {
			type: "string",
			short: "t",
			description: "GitHub token for authentication",
		},
	},
	strict: true,
})

const requireArg = (name) => {
	if (typeof values[name] === "undefined") {
		console.error(`Error: Missing required argument -- "${name}"`)
		process.exit(1)
	}
}

const args = ["repo-owner", "repo-name", "tf-token", "github-token"]
args.forEach(requireArg)

await syncSettings({
	repoOwner: values["repo-owner"],
	repoName: values["repo-name"],
	environmentsWorkspaceDir: values["environments-workspace-dir"],
	tfToken: values["tf-token"],
	githubToken: values["github-token"],
}).catch((error) => {
	console.error("Sync settings failed:", error)
	process.exit(1)
})
