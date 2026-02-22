/** @import { Configs } from "./core.js" */

import vitest from "@vitest/eslint-plugin"
import { FILE_EXTENSIONS } from "./core.js"
import { defineConfig } from "eslint/config"

/** @type {Configs} */
const config = defineConfig({
	name: "@duncan3142/eslint-config/vitest",
	files: [`**/*.{test,spec}.{${FILE_EXTENSIONS.JSTS.join(",")}}`],
	extends: [vitest.configs.recommended],
})

export { config }
