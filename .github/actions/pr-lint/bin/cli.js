#!/usr/bin/env node

import process from "node:process"
import console from "node:console"
import { parseArgs } from "node:util"
import { prLint } from "#lib"

const { values } = parseArgs({
	options: {
		"github-token": {
			type: "string",
			short: "t",
			description: "GitHub token for posting PR comments",
		},
		"event-path": {
			type: "string",
			short: "e",
			default: process.env.GITHUB_EVENT_PATH,
			description: "Path to the GitHub event payload JSON",
		},
	},
	strict: true,
})

const requireArg = (name) => {
	const argValue = values[name]
	if (typeof argValue === "undefined") {
		console.error(`Error: Missing required argument -- "${name}"`)
		process.exit(1)
	}
}

requireArg("github-token")
requireArg("event-path")

await prLint({
	eventPath: values["event-path"],
	githubToken: values["github-token"],
})
	.then(({ valid, errors }) => {
		if (valid) {
			console.log("PR lint passed.")
		} else {
			for (const error of errors) {
				console.error(error)
			}
			process.exit(1)
		}
	})
	.catch((error) => {
		console.error("PR lint failed:", error)
		process.exit(1)
	})
