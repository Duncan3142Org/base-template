---
name: integration-tests
description: "How to write integration tests that cross a process boundary. Use this skill whenever a test connects to a real TCP socket — Postgres in a container, WireMock for sibling services, a real message broker. Covers dev container infrastructure setup, over-the-wire mocking, subcutaneous integration tests, and scope discipline. If everything runs in-process (PGLite, in-memory), see `unit-tests` instead."
---

# Integration Tests

## Philosophy

Detroit (classicist) school. Test behaviour, not implementation. Don't test
what you don't own. Integration tests verify adapter wiring — they don't
duplicate domain logic coverage.

## Purpose

Integration tests verify that adapters - the code at the boundaries of
the system - behave correctly when interacting with real or realistically
simulated external dependencies over a process boundary. They answer:
"does this adapter actually work when wired up to the thing it talks to?"

## The Process Boundary Distinction

The defining characteristic of an integration test is that it crosses a
process boundary: the test makes real network calls, connects to real
TCP sockets, or otherwise leaves the test process to interact with an
external system.

If the dependency runs in-process (e.g., PGLite as an in-memory database,
an in-process HTTP handler via light-my-request), that is a unit test -
even if it exercises a broad slice of application behaviour. See the
unit-tests skill.

## Owned Infrastructure: Dev Containers

Dependencies the project owns or operates (databases, message brokers,
caches, event buses) are run as real instances inside dev containers
(e.g., Testcontainers, Docker Compose).

This avoids the false confidence that comes from in-memory fakes which
may not faithfully reproduce the behaviour of the real dependency -
particularly around transactions, constraints, and query semantics.

Integration tests against owned infrastructure typically focus on the
happy path. The goal is to confirm the adapter integrates correctly,
not to exhaustively test the dependency itself.

## Sibling Services: Over-the-Wire Mocks

Dependencies owned by other teams or external providers are simulated
using over-the-wire HTTP mocks (e.g., WireMock, MockServer).

These run as a local HTTP server that the adapter connects to as if it
were the real service. This tests the full HTTP client path -
serialisation, headers, error handling, timeouts - without depending on
the availability or state of the real service.

Stubs are configured to return realistic responses for the scenarios
under test. Both success and key failure modes (e.g., 404, 500, timeout)
are worth covering.

Example WireMock stub setup (using `wiremock-rest-client` or equivalent):

```typescript
import WireMock from "wiremock-rest-client"

const wireMock = new WireMock("http://localhost:8080")

beforeAll(async () => {
	await wireMock.createMapping({
		request: { method: "GET", url: "/users/42" },
		response: {
			status: 200,
			headers: { "Content-Type": "application/json" },
			jsonBody: { id: 42, email: "alice@example.com" },
		},
	})
})

afterAll(async () => {
	await wireMock.clearAllMappings()
})
```

## Subcutaneous Integration Tests

A subcutaneous test becomes an integration test when the application
context is backed by real out-of-process infrastructure - a Postgres
container, a real message broker, a WireMock instance.

These tests exercise a broad slice of the application (routing,
validation, business logic, persistence) through its API or service
entry point, with real network calls to real dependencies. They catch
wiring, configuration, and middleware issues that unit tests miss.

## Infrastructure Startup

Owned infrastructure (Postgres, message brokers, caches) starts before the test suite and
is shared across tests in the same run. Docker Compose is the preferred approach in dev
containers:

```typescript
import { execSync } from "node:child_process"

beforeAll(() => {
	execSync("docker compose up -d postgres", { stdio: "inherit" })
	// Wait for readiness — use a health-check loop or `wait-for-it`
})

afterAll(() => {
	execSync("docker compose down", { stdio: "inherit" })
})
```

When using Testcontainers directly (for CI portability without Docker Compose):

```typescript
import { PostgreSqlContainer } from "@testcontainers/postgresql"

let container: StartedPostgreSqlContainer

beforeAll(async () => {
	container = await new PostgreSqlContainer().start()
	process.env.DATABASE_URL = container.getConnectionUri()
})

afterAll(async () => {
	await container.stop()
})
```

## Test Cleanup

Database state must be isolated between tests. Two patterns are common:

**Truncate between tests** — simpler, works across all scenarios:

```typescript
afterEach(async () => {
	await db.query("TRUNCATE TABLE orders, order_items RESTART IDENTITY CASCADE")
})
```

**Transaction rollback** — faster but only works when the test and the code under test
share the same connection:

```typescript
beforeEach(async () => {
	await db.query("BEGIN")
})
afterEach(async () => {
	await db.query("ROLLBACK")
})
```

Prefer truncation when the code under test manages its own connections or transactions;
rollback is appropriate for repository-layer tests where the connection is injected.

## Scope and Speed

Integration tests are slower than unit tests by nature. Keeping their
scope focused - one adapter, one interaction pattern - helps maintain
a fast feedback loop.

Where a test requires extensive setup or exercises multiple adapters in
concert, consider whether the same confidence could be achieved more
efficiently at a different level.
