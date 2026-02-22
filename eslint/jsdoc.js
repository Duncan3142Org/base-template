/** @import { Configs } from "./core.js" */

import jsDoc from "eslint-plugin-jsdoc"
import { defineConfig } from "eslint/config"
import { filePattern, FILE_EXTENSIONS } from "./core.js"

/** @type {Configs} */
const custom = defineConfig({
	name: "@duncan3142/eslint-config/jsdoc/custom",
	rules: {
		"jsdoc/require-jsdoc": [
			"warn",
			{
				publicOnly: true,
				require: {
					ArrowFunctionExpression: true,
					ClassDeclaration: true,
					ClassExpression: true,
					FunctionDeclaration: true,
					FunctionExpression: true,
					MethodDefinition: true,
				},
			},
		],
		"jsdoc/no-blank-blocks": ["error", { enableFixer: false }],
		"jsdoc/require-asterisk-prefix": "error",
		"jsdoc/require-description": "error",
		"jsdoc/sort-tags": "error",
		"jsdoc/require-hyphen-before-param-description": "error",
		"jsdoc/no-blank-block-descriptions": "error",
		"jsdoc/no-bad-blocks": "error",
		"jsdoc/check-line-alignment": "error",
		"jsdoc/check-indentation": "error",
		"jsdoc/check-syntax": "error",
	},
	files: [filePattern(...FILE_EXTENSIONS.JSTS)],
})

/** @type {Configs} */
const ts = defineConfig({
	name: "@duncan3142/eslint-config/jsdoc",
	files: [filePattern(...FILE_EXTENSIONS.TS)],
	extends: [jsDoc.configs["flat/recommended-typescript-error"], custom],
})

/** @type {Configs} */
const js = defineConfig({
	name: "@duncan3142/eslint-config/jsdoc",
	files: [filePattern(...FILE_EXTENSIONS.JS)],
	extends: [jsDoc.configs["flat/recommended-error"], custom],
})

/** @type {Configs} */
const config = defineConfig(ts, js, custom)

export { config }
