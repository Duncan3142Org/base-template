/** @import { Config } from "./core.js" */

import { importX } from "eslint-plugin-import-x"
import { filePattern, FILE_EXTENSIONS, lintAll } from "./core.js"
import { defineConfig } from "eslint/config"

/* -------------------------------------------------------------------------- */
/*                                   Configs                                  */
/* -------------------------------------------------------------------------- */

/** @type {Config} */
const custom = {
	name: "@duncan3142/eslint-config/import/custom",
	rules: {
		"import-x/named": "off", // tsc config
		"import-x/namespace": "off", // tsc config
		"import-x/default": "off", // tsc config
		"import-x/no-anonymous-default-export": "off",
		"import-x/no-default-export": "off",
		"import-x/no-named-as-default-member": "off", // tsc config
		"import-x/no-named-as-default": lintAll(),
		"import-x/prefer-default-export": "off",
		"import-x/no-unresolved": "off", // tsc config
		"import-x/extensions": "off", // tsc config
		"import-x/no-relative-parent-imports": "error",
		"import-x/no-internal-modules": "error",
		"import-x/no-extraneous-dependencies": "off",
		"import-x/no-empty-named-blocks": "error",
		"import-x/no-unassigned-import": "error",
		"import-x/no-cycle": lintAll(),
		"import-x/no-unused-modules": lintAll(),
		"import-x/no-deprecated": lintAll(),
		"import-x/no-self-import": "error",
		"import-x/no-commonjs": "error",
		"import-x/order": "error",
		"import-x/first": "error",
		"import-x/exports-last": "error",
		"import-x/newline-after-import": "error",
		"import-x/no-duplicates": ["error", { "prefer-inline": true }],
		"import-x/no-absolute-path": "error",
		"import-x/no-useless-path-segments": "error",
		"import-x/group-exports": "error",
		"import-x/no-mutable-exports": "error",
	},
}

const config = defineConfig({
	name: "@duncan3142/eslint-config/import",
	files: [filePattern(...FILE_EXTENSIONS.JSTS)],
	// @ts-expect-error - Legacy ESLint types
	extends: [importX.flatConfigs.recommended, importX.flatConfigs.typescript, custom],
})

export { config }
