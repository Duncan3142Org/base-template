import {
	Base,
	JSDoc,
	Promise,
	TypeScript,
	Ignored,
	ImportX,
	Prettier,
	Comments,
	Core,
	Vitest,
} from "./eslint/index.ts"

const configs = Core.defineConfig(
	Core.config,
	Ignored.config(),
	Base.config,
	Comments.config,
	TypeScript.config,
	ImportX.config,
	Promise.config,
	JSDoc.config,
	Vitest.config,
	Prettier.config
)

export default configs
