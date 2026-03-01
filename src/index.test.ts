import { describe, expect, it } from "vitest"
import { helloWorld } from "./index.ts"

describe("index", () => {
	it("should say hello", () => {
		expect(helloWorld()).toBe("Hello, World!")
	})
})
