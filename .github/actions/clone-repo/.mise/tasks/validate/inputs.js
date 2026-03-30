#!/usr/bin/env node

//MISE description="Validate inputs and required tools for clone-repo action"

//USAGE flag "--repo-owner <repo-owner>" {
//USAGE   required #true
//USAGE   env "GITHUB_REPOSITORY_OWNER"
//USAGE   help "Repository owner name"
//USAGE }
//USAGE flag "--clone-repo-name <clone-repo-name>" {
//USAGE   required #true
//USAGE   env "CLONE_REPO_NAME"
//USAGE   help "Clone repository name"
//USAGE }
//USAGE flag "--source-repo-name <source-repo-name>" {
//USAGE   required #true
//USAGE   env "SOURCE_REPO_NAME"
//USAGE   help "Source repository name"
//USAGE }
//USAGE flag "--tf-org-name <tf-org-name>" {
//USAGE   required #true
//USAGE   env "TF_ORG_NAME"
//USAGE   help "Terraform Cloud Organization Name"
//USAGE }

import console from "node:console"
import { env, exit } from "node:process"
import { execa } from "execa"

const $ = execa({ stderr: "inherit" })

// --- Visual Helpers ---
const RED = "\x1b[0;31m"
const NC = "\x1b[0m"

// --- Inputs ---
const repoOwner = env.usage_repo_owner
const cloneRepoName = env.usage_clone_repo_name
const sourceRepoName = env.usage_source_repo_name
const tfOrgName = env.usage_tf_org_name

// --- Validate name inputs ---
const namePattern = /^[a-z-]+$/
for (const [label, value] of Object.entries({
	repoOwner,
	cloneRepoName,
	sourceRepoName,
	tfOrgName,
})) {
	if (!namePattern.test(value)) {
		console.error(
			`${RED}Invalid name '${value}' (${label}). Only lowercase characters and hyphens are allowed.${NC}`
		)
		exit(1)
	}
}
const tools = ["gh", "yq", "comby", "sed"]

// --- Tool checks ---
await Promise.allSettled(
	tools.map((tool) =>
		$`which ${tool}`.catch(() => {
			console.error(`${RED}Error: '${tool}' is not installed.${NC}`)
		})
	)
).then((results) => {
	const failed = results.find(({ status }) => status === "rejected")
	if (failed) {
		exit(1)
	}
})
