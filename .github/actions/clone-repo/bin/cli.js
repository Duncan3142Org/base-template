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
		},
		step: {
			type: "string",
			description: "Run a single step: validate, branch, terraform, hydrate, clone",
		},
		"no-commit": {
			type: "boolean",
			default: false,
			description: "Skip git commit after hydration (hydrate step only)",
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

/**
 * Per-step required flags. Only the flags each step actually needs.
 */
const stepRequirements = {
	validate: ["repo-name", "repo-owner", "source-repo-name", "tf-org-name"],
	branch: ["repo-name", "repo-owner", "github-token", "workspace-dir"],
	terraform: ["repo-name", "tf-org-token", "tf-project-id", "tf-org-name"],
	hydrate: ["repo-name", "repo-owner", "source-repo-name", "workspace-dir"],
	clone: [
		"repo-name",
		"repo-owner",
		"source-repo-name",
		"template-branch",
		"github-token",
		"workspace-dir",
	],
}

const requirements = new Set(Object.values(stepRequirements).flat())

const VALID_STEPS = Object.keys(stepRequirements)

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
			noCommit: values["no-commit"],
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
	const selectedStep = values.step

	if (selectedStep) {
		if (!VALID_STEPS.includes(selectedStep)) {
			console.error(
				`Error: Unknown step "${selectedStep}". Valid steps: ${VALID_STEPS.join(", ")}`
			)
			process.exit(1)
		}

		const args = stepRequirements[selectedStep]
		args.forEach(requireArg)

		await steps[selectedStep]()
	} else {
		// Full pipeline — all flags required
		requirements.forEach(requireArg)

		await pipeline.reduce(async (prev, step) => {
			await prev
			await steps[step]()
		}, Promise.resolve())
	}
}

await run().catch((error) => {
	console.error(error.message)
	process.exit(1)
})
