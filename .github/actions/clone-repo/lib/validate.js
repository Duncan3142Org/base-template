import { execa } from "execa"
import { COLOUR_CODES } from "./colour.js"

/**
 * @typedef {object} ValidateOptions
 * @property {string} repoOwner - Repository owner name.
 * @property {string} cloneRepoName - Clone repository name.
 * @property {string} sourceRepoName - Source repository name.
 * @property {string} tfOrgName - Terraform Cloud organization name.
 */

/**
 * Validates inputs and required tools for the clone-repo action.
 * @param {ValidateOptions} options - The options for the validate step.
 */
async function validate({ repoOwner, cloneRepoName, sourceRepoName, tfOrgName }) {
	const $ = execa({ stderr: "inherit" })

	const namePattern = /^[a-z-]+$/
	for (const [label, value] of Object.entries({
		repoOwner,
		cloneRepoName,
		sourceRepoName,
		tfOrgName,
	})) {
		if (!namePattern.test(value)) {
			throw new Error(
				`${COLOUR_CODES.RED}Invalid name '${value}' (${label}). Only lowercase characters and hyphens are allowed.${COLOUR_CODES.NC}`
			)
		}
	}

	const tools = ["gh", "yq", "comby", "sed"]
	const missing = []

	await Promise.allSettled(
		tools.map((tool) =>
			$`${tool} --version`.catch(() => {
				missing.push(tool)
			})
		)
	)

	if (missing.length > 0) {
		throw new Error(
			`${COLOUR_CODES.RED}Missing required tools: ${missing.join(", ")}${COLOUR_CODES.NC}`
		)
	}
}

export { validate }
