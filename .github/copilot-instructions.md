# Repository Instructions

This repository is the base template for `@duncan3142org` projects.

- Use the dev container configuration in `.devcontainer/` as the expected development environment.
- The container sets `MISE_ENV=dev`. Do not change or remove that variable.
- The host uses rootless Docker, so Docker CLI commands should work without elevated privileges.
- The primary toolchain is Node.js 24 and npm 11, managed through Mise.

## Repository Layout

- `.github/` contains GitHub Actions workflows and repository environment configuration managed by Terraform.
- `.mise/` contains Mise tool configuration, composite task TOML files, and the task scripts invoked by Mise tasks.
- `src/` contains source code.
- `test/` contains unit, integration, and contract tests.
- `.devcontainer/` contains the development container configuration.

## Commands

- Use `mise tasks ls` to list available tasks and their descriptions.
- Use `mise tasks info <task>` for specific task info.
- Use `mise run <task>` to execute a task.

## Working Style

- Run relevant validation commands before finishing.
