/** @import { Config, Configs } from "./core.js" */

// @ts-expect-error -- Package lacks types
import promise from "eslint-plugin-promise"
import { filePattern, FILE_EXTENSIONS } from "./core.js"
import { defineConfig } from "eslint/config"

/** @type {Config} */
const custom = {
	name: "@duncan3142/eslint-config/promise/custom",
	rules: {
		"promise/no-return-wrap": ["error", { allowReject: true }],
	},
}

/** @type {Configs} */
const config = defineConfig({
	name: "@duncan3142/eslint-config/promise",
	files: [filePattern(...FILE_EXTENSIONS.JSTS)],
	extends: [promise.configs["flat/recommended"], custom],
})

export { config }
