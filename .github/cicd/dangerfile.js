import { danger, fail, markdown } from "danger"
import load from "@commitlint/load"
import lint from "@commitlint/lint"
import { remark } from "remark"

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
	const prBody = danger.github.pr.body || ""

	const validate = () => {
		if (prBody.length === 0) {
			return true
		}

		const isChangesHeader = (node) => {
			if (node.type !== "paragraph") {
				return false
			}
			// Must have exactly one child (the emphasis node)
			if (node.children.length !== 1) {
				return false
			}

			const [firstChild] = node.children
			if (firstChild.type !== "emphasis") {
				return false
			}
			if (firstChild.children.length !== 1) {
				return false
			}

			const [innerNode] = firstChild.children
			if (innerNode.type !== "text") {
				return false
			}

			return /^Changes:$/.test(innerNode.value)
		}

		const result = remark().parse(prBody)
		const children = result.children

		if (children.length === 0) {
			return true
		}
		const [first, ...rest] = children
		if (!isChangesHeader(first)) {
			return false
		}
		return rest.every((node) => node.type === "list")
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

await validateTitle()
validateBody()
