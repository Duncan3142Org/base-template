import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		name: "unit",
		include: ["test/**/*.test.ts"],
	},
	ssr: {
		resolve: {
			conditions: [
				"@deafrex/node-template:src",
				"@deafrex/node-template:test",
				"import",
				"default",
			],
		},
	},
})
