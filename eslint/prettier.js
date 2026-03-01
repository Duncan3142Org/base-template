/** @import { Configs } from "./core.js" */

import prettier from "eslint-config-prettier"
import { defineConfig } from "eslint/config"

/** @type {Configs} */
const config = defineConfig(prettier, {
	rules: {
		curly: "error",
	},
})

export { config }
