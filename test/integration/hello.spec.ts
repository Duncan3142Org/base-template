import { describe, expect, it } from "vitest"
import { id } from "#test/fixture"
import { helloWorld } from "#src"

describe("hello", () => {
	it("should say hello", async () => {
		await expect(helloWorld(0)).resolves.toBe("Hello, World!")
		expect(id).toBe(0)
	})
})
