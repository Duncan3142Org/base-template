import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		name: "contract",
		include: ["test/**/*.contract.ts"],
		passWithNoTests: true,
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
