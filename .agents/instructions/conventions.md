# Conventions

## Commits

- Follow [Conventional Commits](https://www.conventionalcommits.org/) specification
- Commitlint enforces commit message format via Husky pre-commit hook
- See `.gitmessage` for the commit message template

## Code Style

- Prettier is used for formatting
- Configuration is in `.prettierrc.js`

## Repository Structure

- `.github/` - GitHub Actions workflows, environments, and admin config
- `.mise/` - Mise task runner configuration
- `tasks/` - Core Mise task scripts
- `src/` - Repo source code
- `.devcontainer/` - Dev Container configuration
- `CHANGELOG.md` - Auto generated changelog from commits
- `package.json` - Project metadata and dependencies
