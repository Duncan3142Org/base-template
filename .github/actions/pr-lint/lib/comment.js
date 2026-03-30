import { Octokit } from "@octokit/rest"

const COMMENT_MARKER = "<!-- pr-lint -->"

/**
 * Finds an existing pr-lint comment on the PR.
 * @param {InstanceType<typeof Octokit>} octokit - An authenticated Octokit instance.
 * @param {{ owner: string, repo: string, prNumber: number }} pr - The PR metadata to identify the PR.
 * @returns {Promise<number | undefined>} The comment ID, or undefined if not found.
 */
async function findComment(octokit, { owner, repo, prNumber }) {
	const { data: comments } = await octokit.issues.listComments({
		owner,
		repo,
		issue_number: prNumber,
	})
	const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER))
	return existing?.id
}

/**
 * Creates or updates the pr-lint comment on a PR.
 * @param {InstanceType<typeof Octokit>} octokit - An authenticated Octokit instance.
 * @param {{ owner: string, repo: string, prNumber: number, body: string }} options - The PR metadata and comment body to post.
 */
async function upsertComment(octokit, { owner, repo, prNumber, body }) {
	const markedBody = `${COMMENT_MARKER}\n${body}`
	const commentId = await findComment(octokit, { owner, repo, prNumber })

	if (commentId) {
		await octokit.issues.updateComment({ owner, repo, comment_id: commentId, body: markedBody })
	} else {
		await octokit.issues.createComment({
			owner,
			repo,
			issue_number: prNumber,
			body: markedBody,
		})
	}
}

/**
 * Deletes the pr-lint comment from a PR if it exists.
 * @param {InstanceType<typeof Octokit>} octokit - An authenticated Octokit instance.
 * @param {{ owner: string, repo: string, prNumber: number }} options - The PR metadata to identify the PR.
 */
async function deleteComment(octokit, { owner, repo, prNumber }) {
	const commentId = await findComment(octokit, { owner, repo, prNumber })

	if (commentId) {
		await octokit.issues.deleteComment({ owner, repo, comment_id: commentId })
	}
}

export { upsertComment, deleteComment }
