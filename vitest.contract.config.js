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
				"@deafrex/node-template:src",
				"@deafrex/node-template:test",
				"import",
				"default",
			],
		},
	},
})
