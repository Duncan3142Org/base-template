import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		name: "integration",
		include: ["test/**/*.spec.ts"],
	},
	ssr: {
		resolve: {
			conditions: ["@deafrex/node-template:test", "import", "default"],
		},
	},
})
