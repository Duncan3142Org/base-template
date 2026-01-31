import { danger, fail, markdown } from "danger"
import load from "@commitlint/load"
import lint from "@commitlint/lint"
import assert from "node:assert"

// 1. Validate PR Title using Commitlint
// This functions loads the rules directly from your commitlint.config.js
async function validateTitle() {
	const prTitle = danger.github.pr.title
	try {
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

**Help:** content must be structured as \`type(scope?): subject\`
  `)
		}
	} catch (error) {
		assert(error instanceof Error)
		fail(`Failed to run commitlint: ${error.message}`)
	}
}

// 2. Validate Body is a List
const prBody = danger.github.pr.body || ""
const nonEmptyLines = prBody.split("\n").filter((line) => line.trim().length > 0)

const indentedItemRegex = /^\s{2,}[-*] /
const isMarkdownList = nonEmptyLines.every((line) => indentedItemRegex.test(line))

if (nonEmptyLines.length > 0 && !isMarkdownList) {
	fail("PR Body must be formatted as an indented markdown list.")
	markdown(`
### ❌ Invalid PR Body

The PR body must strictly consist of **indented** markdown list items.
Each line must start with at least 2 spaces, followed by \`- \` or \`* \`.
This ensures it renders correctly as a nested list in the changelog.

**Correct Example:**
\`\`\`
  - Added feature A
  - Fixed bug B
\`\`\`

**Found content:**
\`\`\`
${prBody}
\`\`\`
  `)
}

// Run the async check
validateTitle()
