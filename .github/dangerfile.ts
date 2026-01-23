import { danger, fail, markdown } from "danger"

// 1. Define your specific regex
// ^           : Start of string
// (feat|...)  : Group 1 - Type
// (\(.+\))?   : Group 2 - Scope (Optional)
// !?          : Optional '!' for breaking changes
// :           : Colon
// .+          : Space and Subject
const conventionalCommitRegex =
	/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+$/

// 2. Get the PR Title
const prTitle = danger.github.pr.title

// 3. Validate
if (!prTitle.match(conventionalCommitRegex)) {
	fail("PR Title does not match the Conventional Commits format.")
	markdown(`
### ❌ Invalid PR Title

The title "**${prTitle}**" is invalid. It must match the regex:
\`${conventionalCommitRegex.toString()}\`

**Examples of valid titles:**
- \`feat: add user login\`
- \`fix(auth): handle expired token\`
- \`feat!: drop support for node 12\` (Breaking Change)
  `)
}
