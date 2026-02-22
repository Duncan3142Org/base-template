import vitest from "@vitest/eslint-plugin"
import { type Configs, FILE_EXTENSIONS } from "./core.ts"
import { defineConfig } from "eslint/config"

const config: Configs = defineConfig({
	name: "@duncan3142/eslint-config/vitest",
	files: [`**/*.{test,spec}.{${FILE_EXTENSIONS.JSTS.join(",")}}`],
	extends: [vitest.configs.recommended],
})

export { config }
