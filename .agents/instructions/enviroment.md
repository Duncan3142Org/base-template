# Environment

- The agents run in a dev container environment, configured in `.devcontainer/`
- The host machine runs rootless docker, allowing the agents to run docker commands without elevated privileges
- `MISE_ENV=dev` is set within the dev container, DO NOT MODIFY IT

## Repository Structure

- `.github/` - GitHub Actions workflows, environments, and admin config
- `.mise/` - Mise task runner configuration
- `tasks/` - Mise task scripts
- `src/` - Repo source code
- `.devcontainer/` - Dev Container configuration.
  - `./devcontainer/.config/mise/config.toml` - Global Mise configuration for dev container environment
- `release.config.js` - Release configuration for `semantic-release`
- `CHANGELOG.md` - Auto generated changelog
- `package.json` - Project metadata and dependencies
