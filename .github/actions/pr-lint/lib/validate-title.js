import load from "@commitlint/load"
import lint from "@commitlint/lint"

/** @import { QualifiedConfig } from "@commitlint/load" */

/**
 * @typedef {object} TitleResult
 * @property {boolean} valid - Whether the PR title is valid according to commitlint rules.
 * @property {string[]} errors - List of validation error messages if the title is invalid.
 */

/**
 * Validates a PR title against commitlint rules.
 * @param {string} title - The PR title to validate.
 * @returns {Promise<TitleResult>} - The result of the PR title validation.
 */
async function validateTitle(title) {
	const { rules, parserPreset } = await load()
	if (Object.keys(rules).length === 0) {
		return { valid: true, errors: [] }
	}

	const result = await lint(
		title,
		rules,
		parserPreset ? { parserOpts: parserPreset.parserOpts } : {}
	)

	if (result.valid) {
		return { valid: true, errors: [] }
	}

	return {
		valid: false,
		errors: result.errors.map((e) => `**${e.name}**: ${e.message}`),
	}
}

export { validateTitle }
