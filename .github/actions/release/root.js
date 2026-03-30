import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Root directory of the action
 * @returns {string} Absolute path to the action root.
 */
const root = () => dirname(fileURLToPath(import.meta.url))
export { root }
