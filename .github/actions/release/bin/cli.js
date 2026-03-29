#!/usr/bin/env node

import process from "node:process"
import console from "node:console"
import { parseArgs } from "node:util"
import { release, DEFAULT_OPTIONS } from "#lib"

/** @import { ReleaseOptions } from "#lib" */

const { values } = parseArgs({
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
		"repo-dir": {
			type: "string",
			short: "r",
			default: DEFAULT_OPTIONS.repoRoot,
			description: "Repository root directory of the release",
		},
	},
	strict: true,
})

/** @type {ReleaseOptions} */
const options = {
	assets: values.asset,
	majorBranch: values["major-branch"],
	minorBranch: values["minor-branch"],
	branchPrefix: values["branch-prefix"],
	branches: values.branch,
	dryRun: values["dry-run"],
	repoRoot: values["repo-dir"],
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
