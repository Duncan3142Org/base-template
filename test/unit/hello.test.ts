import { describe, expect, it } from "vitest"
import { helloWorld } from "#src"
import { id } from "#test/fixture"

describe("hello", () => {
	it("should say hello", () => {
		expect(helloWorld()).toBe("Hello, World!")
		expect(id).toBe(0)
	})
})
