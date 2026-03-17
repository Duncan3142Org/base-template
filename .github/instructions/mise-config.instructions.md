---
name: mise-config-conventions
description: "Use when working on Mise TOML config files that define shared tools, composite tasks, or environment-specific orchestration."
applyTo: ".mise/*.toml"
---

# Mise Config Conventions

- Keep `.mise/*.toml` focused on configuration and orchestration. If a task needs to call external tools directly or needs non-trivial control flow, implement it as a shell script under `.mise/tasks/` instead.
- Define composite workflows in TOML with `run.tasks`, and keep the actual command bodies in the referenced task scripts.
- Use `depends` for prerequisites and `run.tasks` for the workflow itself so task ordering stays easy to scan.
- Keep shared tool versions, shared settings, and reusable cross-environment workflows in `.mise/config.toml`.
- Keep `.mise/config.dev.toml`, `.mise/config.ci.toml`, and `.mise/config.cd.toml` limited to environment-specific environment variables, overrides, or top-level orchestration.
- Prefer composing existing tasks over duplicating workflow steps across multiple TOML files.
- Pass explicit flags or arguments in `run.tasks` entries when selecting script behavior, following existing patterns such as `test --mode=unit`.
- Keep composite task chains short and conceptually related. If a task becomes broad in scope, introduce an intermediate task instead.
- Treat the scripts in `.mise/tasks/` as the authoritative place for script task descriptions, CLI metadata, and implementation details.
- For composite tasks defined in the TOML, ensure the TOML entry has appropriate metadata, such as an informative description
