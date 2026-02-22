import prettier from "eslint-config-prettier"
import { type Configs } from "./core.ts"
import { defineConfig } from "eslint/config"

const config: Configs = defineConfig(prettier, {
	rules: {
		curly: "error",
	},
})

export { config }
