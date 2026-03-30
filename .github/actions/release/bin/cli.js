#!/usr/bin/env node

import process from "node:process"
import console from "node:console"
import { parseArgs } from "node:util"
import { release, DEFAULT_OPTIONS } from "#lib"

/** @import { ReleaseOptions } from "#lib" */

const { values, positionals } = parseArgs({
	options: {
		asset: {
			type: "string",
			short: "a",
			multiple: true,
			default: DEFAULT_OPTIONS.assets,
			description: "Files to commit after release",
		},
		"major-branch": {
			type: "boolean",
			default: DEFAULT_OPTIONS.majorBranch,
			description: "Update major version branch (e.g., v/1)",
		},
		"minor-branch": {
			type: "boolean",
			default: DEFAULT_OPTIONS.minorBranch,
			description: "Update minor version branch (e.g., v/1.2)",
		},
		"branch-prefix": {
			type: "string",
			default: DEFAULT_OPTIONS.branchPrefix,
			description: "Branch path prefix for version branches",
		},
		branch: {
			type: "string",
			short: "b",
			multiple: true,
			default: DEFAULT_OPTIONS.branches,
			description: "Release branches",
		},
		"dry-run": {
			type: "boolean",
			default: false,
			short: "d",
			description: "Run without publishing",
		},
		ci: {
			type: "boolean",
			default: DEFAULT_OPTIONS.ci,
			short: "c",
			description: "Run in CI mode",
		},
		"github-pkg-token": {
			type: "string",
			short: "p",
			description: "GitHub token with permissions to publish packages",
		},
		"github-token": {
			type: "string",
			short: "t",
			description: "GitHub token with permissions to create releases and push commits",
		},
		"git-author-name": {
			type: "string",
			description: "Name to use for the author of release commits",
		},
		"git-author-email": {
			type: "string",
			description: "Email to use for the author of release commits",
		},
	},
	allowPositionals: true,
	strict: true,
})

const requireArg = (name) => {
	const argValue = values[name]
	if (typeof argValue === "undefined") {
		console.error(`Error: Missing required argument -- "${name}"`)
		process.exit(1)
	}
}

requireArg("github-pkg-token")
requireArg("github-token")
requireArg("git-author-name")
requireArg("git-author-email")

const [repoRoot = DEFAULT_OPTIONS.repoRoot] = positionals

/** @type {ReleaseOptions} */
const options = {
	assets: values.asset,
	majorBranch: values["major-branch"],
	minorBranch: values["minor-branch"],
	branchPrefix: values["branch-prefix"],
	branches: values.branch,
	dryRun: values["dry-run"],
	ci: values.ci,
	repoRoot,
	githubToken: values["github-token"],
	githubPkgToken: values["github-pkg-token"],
	gitAuthorName: values["git-author-name"],
	gitAuthorEmail: values["git-author-email"],
}

await release(options)
	.then((result) => {
		if (result !== false) {
			const { nextRelease } = result
			console.log(`Published ${nextRelease.type} release, version ${nextRelease.version}`)
		} else {
			console.log("No release published.")
		}
	})
	.catch((error) => {
		console.error("Release failed", error)
		process.exit(1)
	})
