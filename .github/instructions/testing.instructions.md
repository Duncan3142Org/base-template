---
name: testing-conventions
description: "Use when working on TypeScript source or tests and you need this repository's test placement and testing-style rules."
applyTo: "test/**/*.test.ts,test/**/*.spec.ts,test/**/*.contract.ts"
---

# Testing Conventions

- All tests live in the `test/` directory, organised into `test/unit/`, `test/integration/`, and `test/contract/` subdirectories.
- Unit tests use the `.test.ts` suffix, see the `unit-tests` skill.
- Integration tests use the `.spec.ts` suffix, see the `integration-tests` skill.
- Contract tests (Pact) use the `.contract.ts` suffix, see the `contract-tests` skill.
- Shared test fixtures live in `test/fixture/`.
- Unit tests follow the Detroit style: test observable behavior, prefer real owned collaborators, and only mock or stub I/O boundaries.
- If a test crosses a process boundary (e.g. uses real TCP sockets, depends on WireMock), treat it as an integration test.
- Consumer driven contract tests (Pact) verify assumptions about interactions with external systems.
