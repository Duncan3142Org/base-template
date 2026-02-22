import comments from "@eslint-community/eslint-plugin-eslint-comments/configs"
import { type Config, type Configs } from "./core.ts"
import { defineConfig } from "eslint/config"

const custom: Config = {
	name: "@duncan3142/eslint-config/comments/custom",
	rules: {
		"@eslint-community/eslint-comments/disable-enable-pair": [
			"error",
			{ allowWholeFile: true },
		],
		"@eslint-community/eslint-comments/require-description": "error",
	},
}

const config: Configs = defineConfig({
	name: "@duncan3142/eslint-config/comments",
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Package lacks types
	extends: [
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Package lacks types
		comments.recommended,
		custom,
	],
})

export { config }
