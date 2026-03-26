#!/usr/bin/env node

//MISE description="Apply declarative hydration manifest to transform template files for a cloned repository"

//USAGE flag "--workspace-dir <workspace-dir>" {
//USAGE   required #true
//USAGE   env "WORKSPACE_DIR"
//USAGE   help "Repository root directory (files resolved relative to this)"
//USAGE }
//USAGE flag "--repo-owner <repo-owner>" {
//USAGE   required #true
//USAGE   env "GITHUB_REPOSITORY_OWNER"
//USAGE   help "Target repository owner (e.g. deafrex)"
//USAGE }
//USAGE flag "--source-repo-name <source-repo-name>" {
//USAGE   required #true
//USAGE   env "SOURCE_REPO_NAME"
//USAGE   help "Source (template) repository name"
//USAGE }
//USAGE flag "--clone-repo-name <clone-repo-name>" {
//USAGE   required #true
//USAGE   env "CLONE_REPO_NAME"
//USAGE   help "Cloned repository name"
//USAGE }
//USAGE flag "--no-commit" {
//USAGE   help "Skip git add and commit after hydration"
//USAGE }

import console from "node:console"
import { existsSync } from "node:fs"
import { glob, readFile, rm } from "node:fs/promises"
import { resolve } from "node:path"
import { env, exit } from "node:process"
import { execa } from "execa"
import { parse } from "yaml"

// --- Visual Helpers ---
const RED = "\x1b[0;31m"
const GREEN = "\x1b[0;32m"
const BLUE = "\x1b[0;34m"
const NC = "\x1b[0m"

// --- Inputs ---
const workspaceDir = env.usage_workspace_dir
const repoOwner = env.usage_repo_owner
const sourceName = env.usage_source_repo_name
const cloneName = env.usage_clone_repo_name
const noCommit = env.usage_no_commit === "true"

// --- Vars for yq (strenv / env) and template interpolation ---
const templateVars = { REPO_OWNER: repoOwner, SOURCE_NAME: sourceName, CLONE_NAME: cloneName }
const $ = execa({ stderr: "inherit", env: templateVars })

// --- Template interpolation ---
// Use {{VAR}} to interpolate a variable. Use \{{VAR}} to emit a literal {{VAR}}.
const template = (str) =>
	str.replace(/\\?\{\{(\w+)\}\}/g, (match, key) => {
		if (match.startsWith("\\")) {
			return match.slice(1)
		}
		if (!(key in templateVars)) {
			throw new Error(`Unknown template variable: ${key}`)
		}
		return templateVars[key]
	})

const failManifest = (message) => {
	throw new Error(`Manifest error: ${message}`)
}

const ensureArray = (value, path) => {
	if (!Array.isArray(value)) {
		failManifest(`${path} must be an array`)
	}
}

const ensureString = (value, path) => {
	if (typeof value !== "string" || value.length === 0) {
		failManifest(`${path} must be a non-empty string`)
	}
}

const validateReplacement = (replacement, path) => {
	if (typeof replacement !== "object" || replacement === null) {
		failManifest(`${path} must be an object`)
	}
	const { match, rewrite } = replacement
	if (typeof match !== "string" || typeof rewrite !== "string") {
		failManifest(`${path} must include string match and rewrite`)
	}
}

// --- Manifest check ---
const manifestPath = resolve(workspaceDir, ".github/hydrate.yml")

if (!existsSync(manifestPath)) {
	console.error(`${RED}Error: Hydration manifest not found at ${manifestPath}${NC}`)
	exit(1)
}

const manifest = await readFile(manifestPath, "utf8").then(parse)
if (typeof manifest !== "object" || manifest === null) {
	failManifest("root document must be an object")
}
const { transformations } = manifest
ensureArray(transformations, "transformations")

console.log(`${BLUE}🚀 Starting hydration: ${sourceName} → ${cloneName}${NC}`)

// --- Process transformations ---
await Array.from(transformations.entries()).reduce(async (acc, [i, transformation]) => {
	await acc
	if (typeof transformation !== "object" || transformation === null) {
		failManifest(`transformations[${i}] must be an object`)
	}
	const { engine, files: patterns = [] } = transformation
	ensureString(engine, `transformations[${i}].engine`)
	ensureArray(patterns, `transformations[${i}].files`)

	// Resolve file globs relative to workspace_dir
	const resolvedFiles = await Promise.all(
		patterns.map((pattern) => Array.fromAsync(glob(pattern, { cwd: workspaceDir })))
	).then((results) => results.flat())

	// Deduplicate
	const uniqueFiles = [...new Set(resolvedFiles)].sort()

	if (uniqueFiles.length === 0) {
		console.log(`${BLUE}   ⏭️  Skipping ${engine} entry ${i + 1} — no files matched${NC}`)
		return
	}

	switch (engine) {
		case "yq": {
			const { expression } = transformation
			ensureString(expression, `transformations[${i}].expression`)
			console.log(`${BLUE}🛠️  yq: processing ${uniqueFiles.length} file(s)...${NC}`)
			await Promise.all(
				uniqueFiles.map(async (file) => {
					const filepath = resolve(workspaceDir, file)
					console.log(`   ${file}`)
					await $`yq eval -i ${expression} ${filepath}`
				})
			)
			return
		}

		case "sed": {
			const { replacements } = transformation
			ensureArray(replacements, `transformations[${i}].replacements`)
			replacements.forEach((replacement, replacementIndex) => {
				validateReplacement(
					replacement,
					`transformations[${i}].replacements[${replacementIndex}]`
				)
			})
			console.log(`${BLUE}🛠️  sed: processing ${uniqueFiles.length} file(s)...${NC}`)
			await Promise.all(
				uniqueFiles.map(async (file) => {
					const filepath = resolve(workspaceDir, file)
					console.log(`   ${file}`)

					await replacements.reduce(async (prev, replacement) => {
						await prev.then(() => {
							const { match, rewrite } = replacement
							const matchStr = template(match)
							const rewriteStr = template(rewrite)
							return $`sed -i ${`s\x01${matchStr}\x01${rewriteStr}\x01g`} ${filepath}`
						})
					}, Promise.resolve())
				})
			)
			return
		}

		case "comby": {
			const { language, replacements } = transformation
			ensureString(language, `transformations[${i}].language`)
			ensureArray(replacements, `transformations[${i}].replacements`)
			replacements.forEach((replacement, replacementIndex) => {
				validateReplacement(
					replacement,
					`transformations[${i}].replacements[${replacementIndex}]`
				)
			})
			console.log(`${BLUE}🧩 comby: processing ${uniqueFiles.length} file(s)...${NC}`)
			await Promise.all(
				uniqueFiles.map(async (file) => {
					const filepath = resolve(workspaceDir, file)
					console.log(`   ${file}`)
					await replacements.reduce(async (prev, replacement) => {
						await prev.then(() => {
							const { match, rewrite } = replacement
							const matchPattern = template(match)
							const rewritePattern = template(rewrite)
							return $`comby ${matchPattern} ${rewritePattern} -language ${language} -in-place -f ${filepath}`
						})
					}, Promise.resolve())
				})
			)
			return
		}

		case "rm": {
			console.log(`${BLUE}🧹 rm: removing ${uniqueFiles.length} file(s)...${NC}`)
			await Promise.all(
				uniqueFiles.map(async (file) => {
					const filepath = resolve(workspaceDir, file)
					console.log(`   ${file}`)
					await rm(filepath, { recursive: true, force: true })
				})
			)
			return
		}

		default:
			failManifest(`unknown engine '${engine}' in transformations[${i}]`)
	}
}, Promise.resolve())

// --- Post-hydration ---

// Format modified files if task exists
const hasFormatTask = await $({ cwd: workspaceDir })`mise tasks info format`
	.then(() => true)
	.catch(() => false)
if (hasFormatTask) {
	console.log(`${BLUE}🎨 Formatting modified files...${NC}`)
	await $({ stdio: "inherit", cwd: workspaceDir })`mise run format --mode write`
}

if (!noCommit) {
	await $({ stdio: "inherit", cwd: workspaceDir })`git add .`
	const hasStagedChanges = await $({ cwd: workspaceDir })`git diff --cached --quiet`
		.then(() => false)
		.catch(() => true)
	if (hasStagedChanges) {
		await $({
			stdio: "inherit",
			cwd: workspaceDir,
		})`git commit -m ${"chore: bootstrap repository [no ci]"}`
	} else {
		console.log(`${BLUE}ℹ️  No changes to commit after hydration.${NC}`)
	}
}

console.log(`${GREEN}✅ Hydration complete.${NC}`)
