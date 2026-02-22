import { danger, fail, markdown, schedule } from "danger"
import load from "@commitlint/load"
import lint from "@commitlint/lint"
import { marked } from "marked"

/**
 * @import { Token } from "marked"
 */

async function validateTitle() {
	const prTitle = danger.github.pr.title

	const { rules, parserPreset } = await load()
	const result = await lint(
		prTitle,
		rules,
		parserPreset ? { parserOpts: parserPreset.parserOpts } : {}
	)

	if (!result.valid) {
		fail("PR Title does not match the Conventional Commits format.")
		const errorList = result.errors.map((e) => `- **${e.name}**: ${e.message}`).join("\n")
		markdown(`
### ❌ Invalid PR Title

The title "**${prTitle}**" failed the commitlint check:

${errorList}

**Help:** content must be structured as \`type(scope?)!?: subject\`
  `)
	}
}

function validateBody() {
	const prBody = danger.github.pr.body ?? ""

	const validate = () => {
		if (prBody.length === 0) {
			return true
		}

		/**
		 * Checks if the given token is a paragraph containing an emphasized "Changes:" text.
		 * @param {Token} token - The token to check.
		 * @returns {boolean} - True if the token is a "Changes:" header, false otherwise.
		 */
		const isChangesHeader = (token) => {
			if (token.type !== "paragraph") {
				return false
			}
			// Must have exactly one child (the emphasis token)
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

		const children = marked.lexer(prBody)

		if (children.length === 0) {
			return true
		}
		const [first, ...rest] = children
		if (!isChangesHeader(first)) {
			return false
		}
		if (rest.length === 0) {
			return false
		}
		return rest.every((token) => token.type === "list")
	}

	if (!validate()) {
		fail("PR Body must consist of a *Changes:* header, followed by a lists of changes.")
		markdown(`
### ❌ Invalid PR Body Structure

**Correct Example:**
\`\`\`markdown
*Changes:*
- Added login feature
- Fixed logout bug
\`\`\`
`)
	}
}

schedule(validateTitle)
validateBody()
