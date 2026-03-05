---
name: testing-philosophy
description: >
  Foundational testing philosophy and principles for the Detroit (classicist) school. Load
  this skill whenever writing, reviewing, or discussing tests — it informs every testing
  decision. Covers what to test vs what to skip, test classification (unit/contract/integration),
  subcutaneous testing strategy, mocking philosophy, and coverage goals. Always consult this
  before the more specific `unit-tests`, `contract-tests`, or `integration-tests` skills.
---

# Testing Philosophy

## School of Thought

The preferred approach follows the Detroit (classicist) school of testing.
The guiding principle: **don't test what you don't own.** Tests focus on the
code and logic this project is responsible for. Verifying the behaviour of
external libraries, frameworks, or third-party services is out of scope for
our tests.

## Test Behaviour, Not Implementation

Tests describe _what_ the code does, not _how_ it does it. A test suite
that mirrors the internal structure of production code becomes a maintenance
burden and breaks on refactors that don't change behaviour.

Good test names read as specifications of behaviour. They answer "given
this context, when this happens, then this outcome is expected" - not
"method X calls method Y with argument Z."

**Good names:** `"calculates shipping cost for oversized items"`,
`"rejects registration when email is already taken"`,
`"publishes OrderPlaced event on successful checkout"`

**Bad names:** `"testCalculate"`, `"shippingService.calculate works"`,
`"calls findByEmail with the provided address"`

Assertions verify observable outcomes: return values, state changes,
published events, side effects at system boundaries. They avoid asserting
on internal call sequences or intermediate state.

## Social Over Solitary

Social tests (where real collaborators are used rather than mocks) are
preferred over solitary, heavily-mocked tests when testing code that
collaborates with other owned components. Real instances of owned classes
and modules are used wherever practical.

This doesn't mean every test must be social. When a piece of logic is
genuinely complex and self-contained, a focused solitary test targeting
that logic is appropriate. The key consideration is whether mocking would
hide real behaviour or merely remove incidental complexity.

## Test Scope and the Pyramid

The test suite leans heavily on:

- **Unit tests** - fast, focused tests covering business logic and domain
  rules. These form the bulk of the suite. Everything runs in a single
  process.
- **Contract tests** - verify that consumer and provider agree on the
  shape and semantics of their interface.
- **Integration tests** - verify that adapters and boundaries behave
  correctly when talking to real, out-of-process dependencies (databases
  in dev containers, sibling services via over-the-wire mocks).

End-to-end tests are used sparingly, reserved for critical user journeys
or integration points that cannot be adequately covered at lower levels.

## Subcutaneous Testing

Subcutaneous testing is a _strategy_, not a test type. It means exercising
the application just below the UI or transport layer - at the API handler
or service entry point - covering a broad slice of real behaviour without
browser-driven tests.

A subcutaneous test can be either a unit test or an integration test,
depending on how dependencies are satisfied:

- **Unit:** the API handler is invoked in-process (e.g., via
  light-my-request or equivalent), with dependencies satisfied by
  in-process substitutes like PGLite. Everything runs in one process,
  test spies and assertions work directly.
- **Integration:** the API handler runs against real out-of-process
  infrastructure (Postgres in a dev container, real message broker),
  with network calls crossing process boundaries.

The material distinction is the process boundary, not whether a
"database" is involved.

## Mocking Guidelines

- **Own code:** real instances are preferred. Mocking internal collaborators
  is avoided because it couples tests to implementation.
- **I/O boundaries:** mocking or stubbing is appropriate to isolate tests
  from network, filesystem, or other external I/O.
- **Sibling services:** over-the-wire mocks (e.g., WireMock) simulate
  neighbouring services at the HTTP level for integration tests.
- **Owned infrastructure:** real instances running in dev containers
  (databases, event buses, caches) are preferred over in-memory fakes
  for integration tests. For unit tests, in-process alternatives (e.g.,
  PGLite) are a valid choice.

## Testability Through Design

Code is structured to be naturally testable. This typically involves:

- Separating business logic from I/O and framework concerns.
- Using dependency injection to supply collaborators.
- Designing thin adapters around external dependencies so the core
  logic remains framework-agnostic and easy to exercise in tests.

Testability is a consequence of good design, not an afterthought bolted
on with test-specific seams.

## Coverage

The goal is meaningful coverage of behaviour, not a coverage percentage
target. Emphasis is on the happy path and critical edge cases - the
highest-risk, highest-value parts of the codebase. 100% line coverage
is not a goal.
