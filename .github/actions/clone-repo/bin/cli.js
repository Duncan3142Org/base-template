#!/usr/bin/env node

import process, { env } from "node:process"
import console from "node:console"
import { parseArgs } from "node:util"
import { validate, branch, terraform, hydrate, clone } from "#lib"

const { values } = parseArgs({
	options: {
		"repo-name": {
			type: "string",
			short: "n",
			description: "Clone repository name",
		},
		"repo-owner": {
			type: "string",
			description: "Target repository owner",
			short: "o",
			default: env.GITHUB_REPOSITORY_OWNER,
		},
		"source-repo-name": {
			type: "string",
			short: "s",
			description: "Source repository name",
		},
		"template-branch": {
			type: "string",
			description: "Template branch to persist in the new repository",
		},
		"github-token": {
			type: "string",
			short: "t",
			description: "GitHub token for authentication",
		},
		"tf-org-token": {
			type: "string",
			description: "Terraform org API token",
		},
		"tf-project-id": {
			type: "string",
			description: "Terraform Cloud project ID",
		},
		"tf-org-name": {
			type: "string",
			description: "Terraform Cloud organization name",
		},
		"workspace-dir": {
			type: "string",
			short: "w",
			description: "Workspace root directory",
			default: process.cwd(),
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

const args = [
	"repo-name",
	"repo-owner",
	"source-repo-name",
	"template-branch",
	"github-token",
	"tf-org-token",
	"tf-project-id",
	"tf-org-name",
	"workspace-dir",
]

const steps = {
	validate: () =>
		validate({
			repoOwner: values["repo-owner"],
			cloneRepoName: values["repo-name"],
			sourceRepoName: values["source-repo-name"],
			tfOrgName: values["tf-org-name"],
		}),
	terraform: () =>
		terraform({
			tfOrgToken: values["tf-org-token"],
			tfProjectId: values["tf-project-id"],
			tfOrgName: values["tf-org-name"],
			cloneRepoName: values["repo-name"],
		}),
	branch: () =>
		branch({
			repoOwner: values["repo-owner"],
			cloneRepoName: values["repo-name"],
			githubToken: values["github-token"],
			workspaceDir: values["workspace-dir"],
		}),
	hydrate: () =>
		hydrate({
			workspaceDir: values["workspace-dir"],
			repoOwner: values["repo-owner"],
			sourceRepoName: values["source-repo-name"],
			cloneRepoName: values["repo-name"],
		}),
	clone: () =>
		clone({
			repoOwner: values["repo-owner"],
			cloneRepoName: values["repo-name"],
			sourceRepoName: values["source-repo-name"],
			templateBranch: values["template-branch"],
			githubToken: values["github-token"],
			workspaceDir: values["workspace-dir"],
		}),
}

const pipeline = ["validate", "terraform", "branch", "hydrate", "clone"]

async function run() {
	args.forEach(requireArg)

	await pipeline.reduce(async (prev, step) => {
		await prev
		await steps[step]()
	}, Promise.resolve())
}

await run().catch((error) => {
	console.error(error.message)
	process.exit(1)
})
