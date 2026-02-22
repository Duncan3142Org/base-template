// @ts-expect-error -- Package lacks types
import promise from "eslint-plugin-promise"
import { filePattern, FILE_EXTENSIONS, type Config, type Configs } from "./core.ts"
import { defineConfig } from "eslint/config"

const custom: Config = {
	name: "@duncan3142/eslint-config/promise/custom",
	rules: {
		"promise/no-return-wrap": ["error", { allowReject: true }],
	},
}

const config: Configs = defineConfig({
	name: "@duncan3142/eslint-config/promise",
	files: [filePattern(...FILE_EXTENSIONS.JSTS)],
	extends: [promise.configs["flat/recommended"], custom],
})

export { config }
