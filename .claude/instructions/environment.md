# Environment

- This is a dev container environment, configured in `.devcontainer/`
- The host machine runs rootless docker, allowing agents to run docker commands without elevated privileges

## Repository Structure

- `.github/` - GitHub Actions workflows, environments, and admin config
- `.mise/` - Mise task runner configuration
- `tasks/` - Mise task scripts
- `src/` - Repo source code and unit tests
- `test/` - Integration tests
- `.devcontainer/` - Dev Container configuration.
- `release.config.js` - Release configuration for `semantic-release`
- `CHANGELOG.md` - Auto generated changelog
- `package.json` - Project metadata and dependencies
- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Vitest configuration
- `eslint.config.js` - ESLint configuration
- `.prettierrc.js` - Prettier configuration
