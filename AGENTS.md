# Agent Instructions

- Use `.github/copilot-instructions.md` as the primary repository-wide instruction source.
- Reusable task-specific guidance lives in `.github/skills/`.
- Use the dev container workflow and keep `MISE_ENV=dev` unchanged.
- Run project automation through `mise run <task>` when a task already exists.
- Follow the testing conventions in `.github/instructions/testing.instructions.md` when working on TypeScript source or tests.
