---
name: testing-conventions
description: "Use when working on TypeScript source or tests and you need this repository's test placement and testing-style rules."
applyTo: "test/**/*.test.ts,test/**/*.spec.ts,test/**/*.contract.ts"
---

# Testing Conventions

- All tests live in the `test/` directory, organised into `test/unit/`, `test/integration/`, and `test/contract/` subdirectories.
- Unit tests use the `.test.ts` suffix.
- Integration tests use the `.spec.ts` suffix.
- Contract tests (Pact) use the `.contract.ts` suffix.
- Shared test fixtures live in `test/fixture/`.
- Single-process tests follow the Detroit style: test observable behavior, prefer real owned collaborators, and only mock or stub I/O boundaries.
- If a test crosses a process boundary, uses real TCP sockets, or depends on external infrastructure, treat it as an integration test.
- Consumer driven contract tests (Pact) verify assumptions about external systems.
