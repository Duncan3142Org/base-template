import console from "node:console"
import { existsSync } from "node:fs"
import { glob, readFile, rm } from "node:fs/promises"
import { resolve } from "node:path"
import { execa } from "execa"
import { parse } from "yaml"
import { COLOUR_CODES } from "./colour.js"

/**
 * @typedef {object} HydrateOptions
 * @property {string} workspaceDir - Repository root directory.
 * @property {string} repoOwner - Target repository owner.
 * @property {string} sourceRepoName - Source (template) repository name.
 * @property {string} cloneRepoName - Cloned repository name.
 */

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

/**
 * Applies the declarative hydration manifest to transform template files.
 * @param {HydrateOptions} options - The options for the hydrate step.
 */
async function hydrate({ workspaceDir, repoOwner, sourceRepoName, cloneRepoName }) {
	const templateVars = {
		REPO_OWNER: repoOwner,
		SOURCE_NAME: sourceRepoName,
		CLONE_NAME: cloneRepoName,
	}
	const $ = execa({ stderr: "inherit", env: templateVars })

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

	const manifestPath = resolve(workspaceDir, ".github/hydrate.yml")

	if (!existsSync(manifestPath)) {
		throw new Error(
			`${COLOUR_CODES.RED}Error: Hydration manifest not found at ${manifestPath}${COLOUR_CODES.NC}`
		)
	}

	const manifest = await readFile(manifestPath, "utf8").then(parse)
	if (typeof manifest !== "object" || manifest === null) {
		failManifest("root document must be an object")
	}
	const { transformations } = manifest
	ensureArray(transformations, "transformations")

	console.log(
		`${COLOUR_CODES.BLUE}🚀 Starting hydration: ${sourceRepoName} → ${cloneRepoName}${COLOUR_CODES.NC}`
	)

	await Array.from(transformations.entries()).reduce(async (acc, [i, transformation]) => {
		await acc
		if (typeof transformation !== "object" || transformation === null) {
			failManifest(`transformations[${i}] must be an object`)
		}
		const { engine, files: patterns = [] } = transformation
		ensureString(engine, `transformations[${i}].engine`)
		ensureArray(patterns, `transformations[${i}].files`)

		const resolvedFiles = await Promise.all(
			patterns.map((pattern) => Array.fromAsync(glob(pattern, { cwd: workspaceDir })))
		).then((results) => results.flat())

		const uniqueFiles = [...new Set(resolvedFiles)].sort()

		if (uniqueFiles.length === 0) {
			console.log(
				`${COLOUR_CODES.BLUE}   ⏭️  Skipping ${engine} entry ${i + 1} — no files matched${COLOUR_CODES.NC}`
			)
			return
		}

		switch (engine) {
			case "yq": {
				const { expression } = transformation
				ensureString(expression, `transformations[${i}].expression`)
				console.log(
					`${COLOUR_CODES.BLUE}🛠️  yq: processing ${uniqueFiles.length} file(s)...${COLOUR_CODES.NC}`
				)
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
				console.log(
					`${COLOUR_CODES.BLUE}🛠️  sed: processing ${uniqueFiles.length} file(s)...${COLOUR_CODES.NC}`
				)
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
				console.log(
					`${COLOUR_CODES.BLUE}🧩 comby: processing ${uniqueFiles.length} file(s)...${COLOUR_CODES.NC}`
				)
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
				console.log(
					`${COLOUR_CODES.BLUE}🧹 rm: removing ${uniqueFiles.length} file(s)...${COLOUR_CODES.NC}`
				)
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

	// Post-hydration
	const hasFormatTask = await $({ cwd: workspaceDir })`mise tasks info format:write`
		.then(() => true)
		.catch(() => false)
	if (hasFormatTask) {
		console.log(`${COLOUR_CODES.BLUE}🎨 Formatting modified files...${COLOUR_CODES.NC}`)
		await $({ stdout: "inherit", cwd: workspaceDir })`mise run format:write`
	}

	await $({ stdout: "inherit", cwd: workspaceDir })`git add .`
	const hasStagedChanges = await $({ cwd: workspaceDir })`git diff --cached --quiet`
		.then(() => false)
		.catch(() => true)
	if (hasStagedChanges) {
		await $({
			stdout: "inherit",
			cwd: workspaceDir,
		})`git commit -m ${"chore: bootstrap repository [no ci]"}`
	} else {
		console.log(
			`${COLOUR_CODES.BLUE}ℹ️  No changes to commit after hydration.${COLOUR_CODES.NC}`
		)
	}

	console.log(`${COLOUR_CODES.GREEN}✅ Hydration complete.${COLOUR_CODES.NC}`)
}

export { hydrate }
