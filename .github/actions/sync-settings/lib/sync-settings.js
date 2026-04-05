import console from "node:console"
import { execa } from "execa"

const RED = "\x1b[0;31m"
const BLUE = "\x1b[0;34m"
const NC = "\x1b[0m"

/**
 * Syncs repository settings and environments using Terraform and GitHub CLI.
 * @param {{ repoOwner: string, repoName: string, environmentsWorkspaceDir: string, tfToken: string, githubToken: string }} opts - The options for syncing settings.
 */
export async function syncSettings({
	repoOwner,
	repoName,
	environmentsWorkspaceDir,
	tfToken,
	githubToken,
}) {
	const $ = execa({ stderr: "inherit" })

	console.log(`🔍  Syncing settings for ${BLUE}'${repoOwner}/${repoName}'${NC}...`)

	// --- Tool checks ---
	await $`gh --version`.catch(() => {
		throw new Error(`${RED}GitHub CLI (gh) is not installed.${NC}`)
	})

	await $`terraform --version`.catch(() => {
		throw new Error(`${RED}Terraform CLI (terraform) is not installed.${NC}`)
	})

	// --- Sync environments ---
	const tfEnv = {
		TF_WORKSPACE: `${repoName}-github-repo`,
		TF_TOKEN_app_terraform_io: tfToken,
	}

	console.log(`🌍  ${BLUE}Syncing environments...${NC}`)
	console.log(`📦  ${BLUE}Using Terraform workspace: ${tfEnv.TF_WORKSPACE}${NC}`)

	console.log(`⚙️  ${BLUE}Initializing Terraform...${NC}`)
	await $({
		env: tfEnv,
		stdout: "inherit",
	})`terraform -chdir=${environmentsWorkspaceDir} init -input=false`

	console.log(`🚀  ${BLUE}Applying Terraform configuration...${NC}`)
	await $({
		env: tfEnv,
		stdout: "inherit",
	})`terraform -chdir=${environmentsWorkspaceDir} apply -auto-approve -input=false`

	console.log(`✅  ${BLUE}Environments synced successfully.${NC}`)

	// --- Pull request settings ---
	const ghEnv = { GH_TOKEN: githubToken }

	console.log("⚙️  Syncing PR settings...")
	await $({
		env: ghEnv,
	})`gh api --method PATCH -H "Accept: application/vnd.github+json" /repos/${repoOwner}/${repoName} -F allow_rebase_merge=false -F allow_squash_merge=true -F allow_merge_commit=false -F allow_auto_merge=true -F delete_branch_on_merge=true -F allow_update_branch=true -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY --silent`

	console.log("  ✅ PR settings applied.")

	console.log(
		"---------------------------------------------------------------------------------"
	)
	console.log("⚠️     MANUAL ACTION REQUIRED: GitHub Archive Program")
	console.log("       The GitHub API does not expose the 'Preserve this repository'")
	console.log("       toggle. You must enable this manually:")
	console.log("")
	console.log(`   🔗  https://github.com/${repoOwner}/${repoName}/settings#features`)
	console.log(
		"---------------------------------------------------------------------------------"
	)
}
