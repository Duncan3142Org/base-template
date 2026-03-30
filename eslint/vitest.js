/** @import { Configs } from "./core.js" */

import vitest from "@vitest/eslint-plugin"
import { defineConfig } from "eslint/config"
import { FILE_EXTENSIONS } from "./core.js"

/** @type {Configs} */
const config = defineConfig({
	name: "@deafrex/eslint-config/vitest",
	files: [`test/**/*.{test,spec,contract}.{${FILE_EXTENSIONS.JSTS.join(",")}}`],
	extends: [vitest.configs.recommended],
})

export { config }
