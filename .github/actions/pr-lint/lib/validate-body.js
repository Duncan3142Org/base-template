import { marked } from "marked"

/** @import { Token } from "marked" */

/**
 * @typedef {object} BodyResult
 * @property {boolean} valid - Whether the PR body structure is valid.
 * @property {string[]} errors - List of validation error messages if the body structure is invalid.
 */

/**
 * Checks if the given token is a paragraph containing an emphasized "Changes:" text.
 * @param {Token} token - The token to check.
 * @returns {boolean} - True if the token is a paragraph with an emphasized "Changes:" text, false otherwise.
 */
function isChangesHeader(token) {
	if (token.type !== "paragraph") {
		return false
	}
	if (token.tokens?.length !== 1) {
		return false
	}

	const [firstChild] = token.tokens
	if (firstChild.type !== "em") {
		return false
	}
	if (firstChild.tokens?.length !== 1) {
		return false
	}

	const [innerNode] = firstChild.tokens
	if (innerNode.type !== "text") {
		return false
	}

	return /^Changes:$/.test(innerNode.text)
}

/**
 * Validates a PR body structure. A valid body is either empty or consists of
 * a *Changes:* header followed by one or more lists.
 * @param {string} body - The PR body to validate.
 * @returns {BodyResult} - The result of the PR body validation.
 */
function validateBody(body) {
	if (body.length === 0) {
		return { valid: true, errors: [] }
	}

	const children = marked.lexer(body)

	if (children.length === 0) {
		return { valid: true, errors: [] }
	}

	const [first, ...rest] = children
	if (!isChangesHeader(first)) {
		return {
			valid: false,
			errors: ["PR Body must start with a *Changes:* header."],
		}
	}
	if (rest.length === 0) {
		return {
			valid: false,
			errors: ["PR Body must include a list of changes after the *Changes:* header."],
		}
	}
	if (!rest.every((token) => token.type === "list")) {
		return {
			valid: false,
			errors: ["PR Body must consist of only lists after the *Changes:* header."],
		}
	}

	return { valid: true, errors: [] }
}

export { validateBody }
