/** @import { ESLint, Linter } from "eslint" */

import { env } from "node:process"
import { defineConfig } from "eslint/config"

/** @typedef {string} Path */

/** @typedef {ReadonlyArray<Path>} Paths */

/** @typedef {Linter.Config} Config */

/** @typedef {Array<Config>} Configs */

/** @typedef {ESLint.Plugin} Plugin */

/** @typedef {Linter.Parser} Parser */

/**
 * File path pattern
 * @typedef {string} Pattern
 */

/**
 * Patterns array
 * @typedef {ReadonlyArray<Pattern>} Patterns
 */

const JS_EXT = /** @type {const} */ (["js", "jsx"])
const TS_EXT = /** @type {const} */ (["ts", "tsx"])

/**
 * @typedef {{ readonly JS: Patterns, readonly TS: Patterns, readonly NODE: Patterns, readonly JSON: Patterns, readonly CSS: Patterns, readonly HTML: Patterns, readonly JSTS: Patterns }} FileExtensions
 */

/** @type {FileExtensions} */
const FILE_EXTENSIONS = {
	JS: JS_EXT,
	TS: TS_EXT,
	NODE: ["node"],
	JSON: ["json", "jsonc"],
	CSS: ["css"],
	HTML: ["html"],
	JSTS: [...JS_EXT, ...TS_EXT],
}

/**
 * Factory function for creating file patterns array
 * @param {Patterns} extensions - Array of file extension patterns
 * @returns {Pattern} File pattern
 */
const filePattern = (...extensions) => `**/*.{${extensions.join(",")}}`

/**
 * Factory function for creating subdirectory file patterns
 * @param {Pattern} dir - Directory pattern
 * @param {Patterns} extensions - Array of file extension patterns
 * @returns {Pattern} File pattern
 */
const subFilePattern = (dir, ...extensions) => `${dir}/${filePattern(...extensions)}`

/**
 * Determines the linting severity based on environment variables.
 * @param {"warn" | "error"} [severity] - Severity level
 * @returns {"warn" | "error" | "off"} Lint severity
 */
const lintAll = (severity) => {
	const { CI = "false", LINT_ALL = "false" } = env
	const isAll = [CI, LINT_ALL].includes("true")
	return isAll ? (severity ?? "error") : "off"
}

/** @type {Config} */
const config = {
	name: "@duncan3142/eslint-config/core",
	linterOptions: {
		reportUnusedDisableDirectives: "error",
		reportUnusedInlineConfigs: "error",
		noInlineConfig: false,
	},
}

export { config, filePattern, subFilePattern, FILE_EXTENSIONS, lintAll, defineConfig }
