#!/usr/bin/env node

//MISE description="Bootstrap a Terraform Cloud workspace"

//USAGE flag "--tf-org-token <tf-org-token>" {
//USAGE   required #true
//USAGE   env "TF_ORG_TOKEN"
//USAGE   help "Terraform Org API token"
//USAGE }
//USAGE flag "--tf-project-id <tf-project-id>" {
//USAGE   required #true
//USAGE   env "TF_PROJECT_ID"
//USAGE   help "Terraform Cloud Project ID"
//USAGE }
//USAGE flag "--tf-org-name <tf-org-name>" {
//USAGE   required #true
//USAGE   env "TF_ORG_NAME"
//USAGE   help "Terraform Cloud Organization Name"
//USAGE }
//USAGE flag "--clone-repo-name <clone-repo-name>" {
//USAGE   required #true
//USAGE   env "CLONE_REPO_NAME"
//USAGE   help "Name of the new repository"
//USAGE }

/*global fetch -- fetch*/
import console from "node:console"
import { env, exit } from "node:process"

// --- Visual Helpers ---
const RED = "\x1b[0;31m"
const BLUE = "\x1b[0;34m"
const NC = "\x1b[0m"

// --- Inputs ---
const tfOrgToken = env.usage_tf_org_token
const tfProjectId = env.usage_tf_project_id
const cloneRepoName = env.usage_clone_repo_name
const tfOrgName = env.usage_tf_org_name

const tfWorkspaceName = `${cloneRepoName}-github-repo`
const tfApiBase = "https://app.terraform.io/api/v2"
const headers = {
	Authorization: `Bearer ${tfOrgToken}`,
	"Content-Type": "application/vnd.api+json",
}

console.log(`${BLUE}☁️  Bootstrapping Terraform Cloud workspace '${tfWorkspaceName}'...${NC}`)

// --- Check if workspace exists ---
const wsResponse = await fetch(
	`${tfApiBase}/organizations/${encodeURIComponent(tfOrgName)}/workspaces/${encodeURIComponent(tfWorkspaceName)}`,
	{ headers }
)

switch (wsResponse.status) {
	case 200:
		console.log("   Workspace already exists. Skipping creation.")
		exit(0)
	case 404: {
		console.log("   Workspace not found. Creating...")

		// --- Create Workspace ---
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

		switch (createWsResponse.status) {
			case 201: {
				console.log("   Workspace created successfully.")

				const createWsBody = await createWsResponse.json()
				const tfWorkspaceId = createWsBody?.data?.id

				if (!tfWorkspaceId) {
					console.error(`${RED}❌ Error: workspace created but ID missing from response${NC}`)
					exit(1)
				}
				console.log(`   ✅ Workspace created (ID: ${tfWorkspaceId}).`)

				// --- Create 'github_repository_name' variable ---
				console.log("   Setting 'github_repository_name' variable...")

				const createVarPayload = {
					data: {
						type: "vars",
						attributes: {
							key: "github_repository_name",
							value: cloneRepoName,
							category: "terraform",
							hcl: true,
							sensitive: false,
						},
					},
				}

				const createVarResponse = await fetch(`${tfApiBase}/workspaces/${tfWorkspaceId}/vars`, {
					method: "POST",
					headers,
					body: JSON.stringify(createVarPayload),
				})
				switch (createVarResponse.status) {
					case 201: {
						console.log("   ✅ Variable set.")
						exit(0)
					}
					default: {
						const detail = await createVarResponse.text()
						console.error(
							`${RED}❌ Error setting variable (HTTP ${createVarResponse.status}): ${detail}${NC}`
						)
						exit(1)
					}
				}
			}
			default: {
				const detail = await createWsResponse.text()
				console.error(
					`${RED}❌ Error creating workspace (HTTP ${createWsResponse.status}): ${detail}${NC}`
				)
				exit(1)
			}
		}
	}
	default: {
		console.error(
			`${RED}❌ Unexpected response (HTTP ${wsResponse.status}) when checking workspace.${NC}`
		)
		exit(1)
	}
}
