import type { ESLint, Linter } from "eslint"
import { defineConfig } from "eslint/config"
import { env } from "node:process"

type Path = string

type Paths = ReadonlyArray<Path>

type Config = Linter.Config

type Configs = Array<Config>

type Plugin = ESLint.Plugin

type Parser = Linter.Parser

/**
 * File path pattern
 */
type Pattern = string

/**
 * Patterns array
 */
type Patterns = ReadonlyArray<Pattern>

const JS_EXT = ["js", "jsx"] as const
const TS_EXT = ["ts", "tsx"] as const

interface FileExtensions {
	readonly JS: Patterns
	readonly TS: Patterns
	readonly NODE: Patterns
	readonly JSON: Patterns
	readonly CSS: Patterns
	readonly HTML: Patterns
	readonly JSTS: Patterns
}

const FILE_EXTENSIONS: FileExtensions = {
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
 * @param extensionPatterns - Array of file extension patterns
 * @returns Array of file patterns
 */
const filePattern = (...extensions: Patterns): Pattern => `**/*.{${extensions.join(",")}}`

const subFilePattern = (dir: Pattern, ...extensions: Patterns): Pattern =>
	`${dir}/${filePattern(...extensions)}`

const lintAll = (severity?: "warn" | "error") => {
	const { CI = "false", LINT_ALL = "false" } = env
	const isAll = [CI, LINT_ALL].includes("true")
	return isAll ? (severity ?? "error") : "off"
}

const config: Config = {
	name: "@duncan3142/eslint-config/core",
	linterOptions: {
		reportUnusedDisableDirectives: "error",
		reportUnusedInlineConfigs: "error",
		noInlineConfig: false,
	},
}

export type { Path, Paths, Pattern, Patterns as Patterns, Config, Configs, Plugin, Parser }
export { config, filePattern, subFilePattern, FILE_EXTENSIONS, lintAll, defineConfig }
