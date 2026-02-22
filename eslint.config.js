import {
	Base,
	JSDoc,
	PromiseLint,
	TypeScript,
	Ignored,
	ImportX,
	Prettier,
	Comments,
	Core,
	Vitest,
} from "./eslint/index.js"

const configs = Core.defineConfig(
	Core.config,
	Ignored.config(),
	Base.config,
	Comments.config,
	TypeScript.config,
	ImportX.config,
	PromiseLint.config,
	JSDoc.config,
	Vitest.config,
	Prettier.config
)

export default configs
