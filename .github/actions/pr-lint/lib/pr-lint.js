import { readFileSync } from "node:fs"
import { Octokit } from "@octokit/rest"
import { validateTitle } from "./validate-title.js"
import { validateBody } from "./validate-body.js"

/** @import { TitleResult } from "./validate-title.js" */
/** @import { BodyResult } from "./validate-body.js" */

/**
 * @typedef {object} LintOptions
 * @property {string} eventPath - Path to the GitHub event payload JSON.
 * @property {string} githubToken - GitHub token for posting PR comments.
 */

/**
 * @typedef {object} LintResult
 * @property {boolean} valid - Whether the PR passed all lint checks.
 * @property {string[]} errors - List of validation error messages if any checks failed.
 */

/**
 * Reads the PR metadata from a GitHub event payload.
 * @param {string} eventPath - Path to the GitHub event payload JSON.
 * @returns {{ owner: string, repo: string, prNumber: number, title: string, body: string }} - PR metadata extracted from the event payload.
 * @throws {Error} If the event payload does not contain a pull_request object.
 */
function readEvent(eventPath) {
	const event = JSON.parse(readFileSync(eventPath, "utf8"))
	const pr = event.pull_request

	if (!pr) {
		throw new Error("Event payload does not contain a pull_request object.")
	}

	const [owner, repo] = event.repository.full_name.split("/")

	return {
		owner,
		repo,
		prNumber: pr.number,
		title: pr.title,
		body: pr.body ?? "",
	}
}

/**
 * Formats validation failures into a markdown comment.
 * @param {TitleResult} titleResult - The result of validating the PR title.
 * @param {BodyResult} bodyResult - The result of validating the PR body.
 * @param {string} title - The PR title that was validated.
 * @returns {string} - The formatted markdown comment.
 */
function formatComment(titleResult, bodyResult, title) {
	const sections = []

	if (!titleResult.valid) {
		const errorList = titleResult.errors.map((e) => `- ${e}`).join("\n")
		sections.push(`### ❌ Invalid PR Title

The title "**${title}**" failed the commitlint check:

${errorList}

**Help:** content must be structured as \`type(scope?)!?: subject\``)
	}

	if (!bodyResult.valid) {
		const errorList = bodyResult.errors.map((e) => `- ${e}`).join("\n")
		sections.push(`### ❌ Invalid PR Body Structure

${errorList}

**Correct Example:**
\`\`\`markdown
*Changes:*
- Added login feature
- Fixed logout bug
\`\`\``)
	}

	return sections.join("\n\n")
}

/**
 * Runs PR linting: validates title and body, posts a PR comment on failure.
 * @param {LintOptions} options - The options for PR linting.
 * @returns {Promise<LintResult>} - The result of the PR linting process.
 */
async function prLint({ eventPath, githubToken }) {
	const { owner, repo, prNumber, title, body } = readEvent(eventPath)

	const [titleResult, bodyResult] = await Promise.all([
		validateTitle(title),
		validateBody(body),
	])

	const valid = titleResult.valid && bodyResult.valid
	const errors = [...titleResult.errors, ...bodyResult.errors]

	if (!valid) {
		const comment = formatComment(titleResult, bodyResult, title)
		const octokit = new Octokit({ auth: githubToken })
		await octokit.issues.createComment({
			owner,
			repo,
			issue_number: prNumber,
			body: comment,
		})
	}

	return { valid, errors }
}

export { prLint, validateTitle, validateBody }
