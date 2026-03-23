import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		name: "integration",
		include: ["test/**/*.spec.ts"],
	},
	ssr: {
		resolve: {
			conditions: ["@duncan3142org/base-template:test", "import", "default"],
		},
	},
})
