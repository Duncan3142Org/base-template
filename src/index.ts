import { setTimeout } from "node:timers/promises"

/**
 * Hello world function
 * @param delay The delay in milliseconds before returning the greeting
 * @returns A greeting message
 */
const helloWorld = async (delay: number): Promise<string> => {
	await setTimeout(delay)
	return "Hello, World!"
}

export { helloWorld }
