import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		name: "contract",
		include: ["test/**/*.contract.ts"],
		passWithNoTests: true,
	},
	resolve: {
		alias: {
			"#duncan3142org/base-template": "./src/index.ts",
		},
	},
})
