/** @import { Configs, Paths } from "./core.js" */

import { resolve } from "node:path"
import { includeIgnoreFile } from "@eslint/compat"
import { defineConfig } from "eslint/config"

const GIT_IGNORE = ".gitignore"
const PRETTIER_IGNORE = ".prettierignore"

/** @type {Paths} */
const IGNORE_FILES_DEFAULT = [GIT_IGNORE, PRETTIER_IGNORE]

/**
 * @typedef {{ readonly ignoreFiles: Paths }} Options
 */

/** @type {Options} */
const defaultOptions = {
	ignoreFiles: IGNORE_FILES_DEFAULT,
}

/**
 * Ignored files
 * @param {object} opts - Options
 * @param {Paths} opts.ignoreFiles - Ignore files
 * @returns {Configs} Ignored files config
 */
const config = ({ ignoreFiles = IGNORE_FILES_DEFAULT } = defaultOptions) =>
	defineConfig(
		ignoreFiles.map((path) => includeIgnoreFile(resolve(path), `Ignore '${path}' files`))
	)

export { config, IGNORE_FILES_DEFAULT }
