import { describe, expect, it } from "vitest"
import { helloWorld } from "#duncan3142org/base-template"

describe("hello", () => {
	it("should say hello", () => {
		expect(helloWorld()).toBe("Hello, World!")
	})
})
