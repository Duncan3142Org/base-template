---
name: unit-tests
description: "How to write unit tests in the Detroit (classicist) style. Use this skill when writing or reviewing in-process tests — business logic, domain rules, API handlers with in-process substitutes (PGLite, light-my-request). Covers what constitutes a 'unit', social vs solitary tests, mocking at I/O boundaries only, subcutaneous unit tests, test naming, fixtures, and assertions. If a test crosses a process boundary (real TCP, real database container), see `integration-tests` instead."
---

# Unit Tests

## Philosophy

Detroit (classicist) school. Test behaviour, not implementation. Don't test
what you don't own. Coverage targets meaningful behaviour, not a percentage.
Testability is a consequence of good design.

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
assertions from Vitest.

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

```typescript
// Good: behaviour-driven name, arrange/act/assert structure
it("rejects registration when email is already taken", async () => {
	// Arrange
	const repo = new InMemoryUserRepository()
	await repo.save(buildUser({ email: "alice@example.com" }))
	const service = new RegistrationService(repo)

	// Act & Assert
	await expect(
		service.register({ email: "alice@example.com", password: "secret" })
	).rejects.toThrow(EmailAlreadyTakenError)
})

// Bad: implementation-mirroring name, asserts on internal call
it("register calls findByEmail", async () => {
	const repo = { findByEmail: vi.fn().mockResolvedValue(existingUser) }
	await registrationService.register(payload)
	expect(repo.findByEmail).toHaveBeenCalledWith("alice@example.com")
})
```

## Describe Grouping Strategy

Group tests by feature or scenario, not by method name. A `describe` block
names the behaviour being exercised, not the function being called.

```typescript
// Good: grouped by scenario
describe("registration", () => {
	describe("when the email is already taken", () => {
		it("rejects with EmailAlreadyTakenError", async () => { ... })
		it("does not create a new account", async () => { ... })
	})

	describe("when the input is valid", () => {
		it("persists the new user", async () => { ... })
		it("publishes a UserRegistered event", async () => { ... })
	})
})

// Bad: grouped by method
describe("RegistrationService.register", () => {
	it("calls findByEmail", async () => { ... })
	it("calls save", async () => { ... })
})
```

## Fixtures and Builders

Test data is created using **builder functions** rather than object literals
scattered across tests. Builders supply sensible defaults and allow individual
fields to be overridden:

```typescript
// test/fixture/users/user.fixture.ts
export function buildUser(overrides: Partial<User> = {}): User {
	return {
		id: 1,
		email: "alice@example.com",
		name: "Alice",
		createdAt: new Date("2024-01-01"),
		...overrides,
	}
}
```

Fixture files use the `.fixture.ts` suffix and live in the `test/fixture/`
directory. The convention `build<Entity>()` is used throughout.

Builders keep test setup readable and resilient to schema changes — when a new
required field is added, only the builder needs updating, not every test that
constructs the entity directly.

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

## Test File Location

Unit test files live in the `test/unit/` directory, mirroring the `src/` structure:

```
src/users/registration.service.ts              # source
test/unit/users/registration.service.test.ts   # unit test
```

Test files use the `.test.ts` suffix (not `.spec.ts`).
Shared test fixtures live in `test/fixture/` and use a `.fixture.ts` suffix.
Test helpers use a `.helper.ts` suffix.
