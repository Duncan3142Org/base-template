import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		name: "unit",
		include: ["test/**/*.test.ts"],
	},
	ssr: {
		resolve: {
			conditions: [
				"@duncan3142org/base-template:src",
				"@duncan3142org/base-template:test",
				"import",
				"default",
			],
		},
	},
})
