---
name: testing-conventions
description: "Use when working on TypeScript source or tests and you need this repository's test placement and testing-style rules."
applyTo: "src/**/*.ts,test/**/*.ts"
---

# Testing Conventions

- Unit tests live alongside the source files they cover in `src/` and use the `.test.ts` suffix.
- Integration tests live in `test/` and use the `.spec.ts` suffix.
- Single-process tests follow the Detroit style: test observable behavior, prefer real owned collaborators, and only mock or stub I/O boundaries.
- If a test crosses a process boundary, uses real TCP sockets, or depends on external infrastructure, treat it as an integration test.
