/*global fetch -- fetch*/
import console from "node:console"
import { COLOUR_CODES } from "./colour.js"

/**
 * @typedef {object} TerraformOptions
 * @property {string} tfOrgToken - Terraform org API token.
 * @property {string} tfProjectId - Terraform Cloud project ID.
 * @property {string} tfOrgName - Terraform Cloud organization name.
 * @property {string} cloneRepoName - Name of the new repository.
 */

/**
 * Bootstraps a Terraform Cloud workspace for the cloned repository.
 * @param {TerraformOptions} options - The options for the terraform step.
 */
async function terraform({ tfOrgToken, tfProjectId, tfOrgName, cloneRepoName }) {
	const tfWorkspaceName = `${cloneRepoName}-github-repo`
	const tfApiBase = "https://app.terraform.io/api/v2"
	const headers = {
		Authorization: `Bearer ${tfOrgToken}`,
		"Content-Type": "application/vnd.api+json",
	}

	console.log(
		`${COLOUR_CODES.BLUE}☁️  Bootstrapping Terraform Cloud workspace '${tfWorkspaceName}'...${COLOUR_CODES.NC}`
	)

	const wsResponse = await fetch(
		`${tfApiBase}/organizations/${encodeURIComponent(tfOrgName)}/workspaces/${encodeURIComponent(tfWorkspaceName)}`,
		{ headers }
	)

	switch (wsResponse.status) {
		case 200:
			console.log("   Workspace already exists. Skipping creation.")
			return

		case 404: {
			console.log("   Workspace not found. Creating...")

			const createWsPayload = {
				data: {
					type: "workspaces",
					attributes: { name: tfWorkspaceName },
					relationships: {
						project: { data: { type: "projects", id: tfProjectId } },
					},
				},
			}

			const createWsResponse = await fetch(
				`${tfApiBase}/organizations/${encodeURIComponent(tfOrgName)}/workspaces`,
				{ method: "POST", headers, body: JSON.stringify(createWsPayload) }
			)

			if (createWsResponse.status !== 201) {
				const detail = await createWsResponse.text()
				throw new Error(
					`${COLOUR_CODES.RED}❌ Error creating workspace (HTTP ${createWsResponse.status}): ${detail}${COLOUR_CODES.NC}`
				)
			}

			console.log("   Workspace created successfully.")

			const createWsBody = await createWsResponse.json()
			const tfWorkspaceId = createWsBody?.data?.id

			if (!tfWorkspaceId) {
				throw new Error(
					`${COLOUR_CODES.RED}❌ Error: workspace created but ID missing from response${COLOUR_CODES.NC}`
				)
			}
			console.log(`   ✅ Workspace created (ID: ${tfWorkspaceId}).`)

			console.log("   Setting 'github_repository_name' variable...")

			const createVarPayload = {
				data: {
					type: "vars",
					attributes: {
						key: "github_repository_name",
						value: cloneRepoName,
						category: "terraform",
						hcl: false,
						sensitive: false,
					},
				},
			}

			const createVarResponse = await fetch(`${tfApiBase}/workspaces/${tfWorkspaceId}/vars`, {
				method: "POST",
				headers,
				body: JSON.stringify(createVarPayload),
			})

			if (createVarResponse.status !== 201) {
				const detail = await createVarResponse.text()
				throw new Error(
					`${COLOUR_CODES.RED}❌ Error setting variable (HTTP ${createVarResponse.status}): ${detail}${COLOUR_CODES.NC}`
				)
			}

			console.log("   ✅ Variable set.")
			return
		}

		default:
			throw new Error(
				`${COLOUR_CODES.RED}❌ Unexpected response (HTTP ${wsResponse.status}) when checking workspace.${COLOUR_CODES.NC}`
			)
	}
}

export { terraform }
