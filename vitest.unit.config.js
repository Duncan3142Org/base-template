import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		name: "unit",
		include: ["src/**/*.test.ts"],
	},
	resolve: {
		alias: {
			"#duncan3142org/base-template": "./src/index.ts",
		},
		tsconfigPaths: true,
	},
})
