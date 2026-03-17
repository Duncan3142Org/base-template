---
name: task-script-conventions
description: "Use when working on Mise task scripts or task wiring in .mise/. Prefer one consolidated bash script with #USAGE flags or args when the underlying tool behavior is the same, instead of creating multiple near-duplicate wrapper scripts."
applyTo: ".mise/tasks/**"
---

# Task Script Conventions

- Prefer a single task script with `#USAGE` flags or arguments when multiple task modes call the same underlying tool.
- Use `.mise/tasks/format` as the reference pattern for usage annotations, defaults, and shell structure.
- Default the script to the most common or safest mode, and let alternate modes be selected through explicit flags.
- Map task flags directly to the underlying tool invocation when practical so the relationship between the task interface and the called command stays obvious.
- Avoid adding separate wrapper scripts for unit, integration, check, write, or similar modes unless the implementations materially differ.
- Keep shell branching small and local. If modes start requiring substantially different setup or validation, split them only when a single script would become harder to understand.
- When a shared script is used by multiple Mise tasks, prefer passing mode-specific values through the task definition rather than duplicating shell logic across files.
- Keep task names and flag names aligned with the behavior they control, for example `--mode unit` or `--mode integration`.
- Ensure the task has an informative description in the #MISE comment
- When a task supports inputs, ensure the options and their effects are clearly documented with #USAGE annotations.
- Run `mise tasks validate` to validate task definitions
