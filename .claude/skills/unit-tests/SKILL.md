---
name: unit-tests
description: >
  Guidance on writing unit tests in the Detroit (classicist) style.
  Consult when writing tests for business logic, domain rules, or any
  code that runs within a single process. Covers what constitutes a
  "unit", social vs solitary tests, mocking at boundaries, testing
  internal complexity, and subcutaneous unit tests using in-process
  infrastructure. The defining characteristic of a unit test is that
  everything runs in a single process.
---

# Unit Tests

## What Constitutes a Unit

In the Detroit school, a "unit" is not necessarily a single class or
function. It is a meaningful slice of behaviour - often a cluster of
collaborating objects that together implement a piece of business logic
or a domain rule.

Tests exercise this behaviour through its public entry points and
assert on observable outcomes, not internal structure.

## The Single-Process Boundary

A unit test runs entirely within a single process. No network calls,
no TCP connections, no out-of-process dependencies. This is the material
distinction from an integration test.

A test can exercise a broad slice of the application - including a
database - and still be a unit test, provided the dependency runs
in-process. For example, PGLite provides a real SQL database that runs
in-memory within the test process. Tests using PGLite are unit tests:
they're fast, deterministic, and compatible with test spies and
assertions from Jest or Vitest.

## Social by Default

Unit tests use real instances of owned collaborators wherever practical.
If class A delegates to class B, and both are owned by this project,
the test for A uses a real B. This ensures the test reflects actual
runtime behaviour and is resilient to internal refactoring.

Not every class needs its own dedicated test file. If a collaborator's
behaviour is fully exercised through the tests of its caller, separate
tests for the collaborator may add maintenance cost without adding
confidence.

## When Solitary Tests Are Appropriate

Some code is internally complex enough to warrant focused, isolated
testing - for example, a parsing algorithm, a state machine, or a
calculation with many edge cases.

When a component's logic is dense and its behaviour is difficult to
fully exercise through a higher-level social test, writing solitary
tests targeting that component directly is a good use of time. The
decision is driven by complexity, not by a rule that every file needs
its own test.

## Subcutaneous Unit Tests

A subcutaneous test that runs entirely in-process is a unit test. This
typically involves invoking the API handler directly (e.g., via
light-my-request or equivalent injection) with dependencies satisfied
by in-process substitutes.

This approach exercises routing, validation, business logic, and data
access in a single fast test - without containers, without network
calls, without test environment orchestration. Test framework features
like spies and mocks remain fully available because everything shares
a process.

These tests are particularly valuable for verifying broad application
behaviour while maintaining the speed and reliability of the unit test
suite.

## Mocking at Boundaries

Within a unit test, the only things typically mocked or stubbed are
I/O concerns that would make the test slow, non-deterministic, or
dependent on external state:

- HTTP calls to external services.
- Filesystem access.
- Clocks, random number generators, or other sources of
  non-determinism.

Internal collaborators - services, repositories, mappers, and other
owned code - are not mocked. If wiring in a real collaborator is
painful, that often signals a design issue worth addressing rather
than a reason to add a mock.

## Test Structure and Naming

Tests are structured around behaviour, following a given/when/then
or arrange/act/assert pattern.

Test names describe the scenario and expected outcome in plain
language. They read as specifications: "calculates tax for
zero-rated items", "rejects expired tokens", "publishes event
on successful registration."

Avoid names that mirror method signatures or describe implementation
steps.

## Assertions

Assertions target the observable result of the behaviour under test:

- Return values.
- State changes visible through public queries.
- Events or messages dispatched to an observable boundary.

Assertions on call counts, argument capture on internal mocks, or
verification of internal method invocation order are avoided - these
couple the test to implementation details.

## Refactoring Confidence

A well-written unit test suite supports refactoring. If changing the
internal structure of the code (without altering its behaviour) causes
tests to fail, those tests are testing implementation rather than
behaviour and are candidates for revision.
