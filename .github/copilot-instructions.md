# Repository Instructions

This repository is the base template for `@duncan3142org` projects.

- Use the dev container configuration in `.devcontainer/` as the expected development environment.
- The container sets `MISE_ENV=dev`. Do not change or remove that variable.
- The host uses rootless Docker, so container and Docker commands should work without elevated privileges.
- The primary toolchain is Node.js 24 and npm 11, managed through Mise.
- Use `mise run <task>` for project automation instead of ad hoc shell commands when a task already exists.
- Run `mise run <task> --help` to inspect task usage before adding new task behavior.

## Repository Layout

- `.github/` contains GitHub Actions workflows and repository environment Terraform configuration.
- `.mise/` contains Mise tool and task configuration.
- `tasks/` contains the shell scripts invoked by Mise tasks.
- `src/` contains source code and colocated unit tests.
- `test/` contains integration tests.
- `.devcontainer/` contains the development container configuration.

## Validation Commands

- Run `mise run install` to install project dependencies.
- Run `mise run format` to check formatting.
- Run `mise run format --mode write` to apply formatting fixes.
- Run `mise run lint` to run ESLint.
- Run `mise run lint --fix` to apply safe lint fixes.
- Run `mise run test` to run the Vitest suite.
- Run `mise run assets` when the change affects generated assets.
- Run `mise run clean` to clean generated files and caches.

## Working Style

- Keep changes minimal and consistent with the existing TypeScript, ESLint, and Prettier configuration.
- Prefer updating existing task scripts and config files over introducing duplicate workflows.
- When changing TypeScript code, run the relevant validation commands before finishing.
- Use the reusable skills in `.github/skills/` when the task matches one of those workflows.
