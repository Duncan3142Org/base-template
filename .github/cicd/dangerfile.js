import { danger, fail, markdown } from "danger"
import load from "@commitlint/load"
import lint from "@commitlint/lint"
import { Parser } from "commonmark"

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

	let isValid = true

	if (prBody.length > 0) {
		const parser = new Parser()
		const ast = parser.parse(prBody)
		let topLevelNodeCount = 0

		const walker = ast.walker()
		let event

		const isChangesHeader = (node) => {
			if (node.type !== "paragraph") {
				return false
			}
			const firstChild = node.firstChild
			if (
				firstChild &&
				firstChild.type === "emph" &&
				firstChild.firstChild &&
				/^Changes:$/.test(firstChild.firstChild.literal || "") &&
				!firstChild.next
			) {
				return true
			}
			return false
		}

		const isTopLevelNode = (node) => {
			return node.parent?.type === "document" && event.entering
		}

		const getNext = () => {
			event = walker.next()
			return event !== null && event !== undefined
		}

		while (getNext()) {
			const node = event.node
			if (node.type === "document") {
				continue
			}

			if (!isTopLevelNode(node)) {
				continue
			}

			topLevelNodeCount++

			if (topLevelNodeCount === 1 && !isChangesHeader(node)) {
				isValid = false
				break
				// All subsequent nodes must be lists elements
			} else if (node.type !== "list") {
				isValid = false
				break
			}
		}
	}

	if (!isValid) {
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
