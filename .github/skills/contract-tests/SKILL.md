---
name: contract-tests
description: "How to write consumer-driven contract tests with Pact.js (V4) for both synchronous HTTP and asynchronous message (Kafka/SQS/SNS) contracts. Use this skill whenever testing API boundaries between services — ensuring a consumer's expectations of a provider are codified and verified. Covers Pact.js setup, HTTP and message consumer interaction definitions, provider verification, pact broker CI flow, and where contracts live. If you need to verify adapter wiring with a real service, see `integration-tests` instead."
---

# Contract Tests

## Philosophy

Contract tests verify interface agreement between services. They answer one
question: do the consumer and provider share the same understanding of the
API boundary? They are not concerned with business logic (that belongs to unit
tests) or adapter wiring (that belongs to integration tests).

## Purpose

Contract tests verify that two services (a consumer and a provider) agree
on the shape and semantics of their interaction. They catch integration
drift early - before it surfaces in a deployed environment.

A contract test answers: "does the provider still honour the expectations
the consumer relies on?"

## Consumer-Driven Contracts

The preferred model is consumer-driven: the consumer defines what it
needs from a provider, and that expectation is codified as a contract.
The provider then verifies that it satisfies all consumer contracts.

This keeps contracts minimal and relevant - only the fields and
behaviours a consumer actually uses are specified, rather than the
provider's entire surface area.

## Tooling

Contract tests use **Pact.js** via the `@pact-foundation/pact` package. All examples use
the `PactV4` API, which is the current baseline and a superset of V3. Use `PactV4` for
both HTTP (synchronous) and message (asynchronous) interactions.

- `PactV4` — the primary API for defining interactions (both HTTP and message).
- `MatchersV3` — the correct import for matchers regardless of pact version; the package
  re-exports them for use with `PactV4`.

`PactV4` supports two interaction kinds:

- **`withRequest` / `willRespondWith`** — synchronous HTTP interactions (REST, JSON API).
- **`withAsynchronousBody`** — asynchronous message interactions (Kafka, SQS, SNS); covers
  the event payload shape, not the transport layer.

Generated pact files live in a `pacts/` directory at the repository root. This directory
is either committed directly or published to a Pact Broker as part of the CI pipeline.

## Test File Location

Contract test files live in the `test/contract/` directory and use the `.contract.ts`
suffix. This separates them from unit tests (`.test.ts`) and integration tests
(`.spec.ts`) while keeping all tests under the shared `test/` root.

```
test/contract/users/user-service.contract.ts   # consumer contract test
```

## When to Use HTTP vs Message Interactions

| Scenario                                               | Interaction kind                         |
| ------------------------------------------------------ | ---------------------------------------- |
| Consumer calls the provider over HTTP (REST, JSON API) | HTTP — `withRequest` / `willRespondWith` |
| Consumer reads events from a broker (Kafka, SQS, SNS)  | Message — `withAsynchronousBody`         |

The message interaction contract covers the **event payload shape**, not the Kafka/broker
transport. Connecting to a real broker is an integration concern and belongs in integration
tests, not contract tests.

## What to Cover

- Request/response shape: required fields, types, status codes.
- Semantic meaning of key fields where ambiguity exists.
- Error responses the consumer is expected to handle.
- Event payload shape for message-driven interactions.

Contract tests focus on the _agreement_, not on business logic. They
are typically lightweight and fast.

## What to Avoid

- Reimplementing provider logic in the consumer's test suite.
- Asserting on fields the consumer doesn't use.
- Treating contract tests as a substitute for the provider's own
  unit or integration tests.
- Starting a real Kafka broker or message bus in a consumer contract test —
  Pact serialises the message in memory and invokes the handler directly.

## Matcher Selection

Use matchers from `MatchersV3` to specify the _type_ of a value rather than its
exact content. This makes contracts resilient to incidental data changes:

| Matcher                   | Use when                                                  |
| ------------------------- | --------------------------------------------------------- |
| `like(value)`             | Type and structure matter; exact value doesn't            |
| `string("example")`       | Field must be a string; value is just an example          |
| `integer(42)`             | Field must be an integer                                  |
| `decimal(3.14)`           | Field must be a decimal number                            |
| `eachLike(item)`          | Field is an array; each element matches the template      |
| `regex(pattern, example)` | Value must match a specific format (e.g., ISO date, UUID) |

Prefer `like()` for most object fields. Reserve exact value matching for
semantically significant identifiers (e.g., status codes, enum values) where
the exact string is part of the contract.

## Consumer Test Examples

### HTTP (Synchronous) Consumer Test

The consumer test defines the interaction and generates the pact file. Tests run against
a local mock server provided by Pact — no real provider needed at this stage.

```typescript
import { PactV4, MatchersV3 } from "@pact-foundation/pact"
import path from "node:path"
import { fetchUser } from "../src/users/user-client.js"

const { like, string } = MatchersV3

const provider = new PactV4({
	consumer: "OrderService",
	provider: "UserService",
	dir: path.resolve(process.cwd(), "pacts"),
})

describe("UserService consumer contract", () => {
	it("returns a user by id", async () => {
		await provider
			.addInteraction()
			.given("user 42 exists")
			.uponReceiving("a GET request for user 42")
			.withRequest("GET", "/users/42")
			.willRespondWith()
			.withStatus(200)
			.withHeader("Content-Type", "application/json")
			.withJsonBody({
				id: like(42),
				email: string("alice@example.com"),
				name: like("Alice"),
			})
			.executeTest(async (mockServer) => {
				const user = await fetchUser(mockServer.url, 42)
				expect(user.id).toBe(42)
				expect(user.email).toBeDefined()
			})
	})

	it("returns 404 when user does not exist", async () => {
		await provider
			.addInteraction()
			.given("user 99 does not exist")
			.uponReceiving("a GET request for a missing user")
			.withRequest("GET", "/users/99")
			.willRespondWith()
			.withStatus(404)
			.executeTest(async (mockServer) => {
				await expect(fetchUser(mockServer.url, 99)).rejects.toThrow(UserNotFoundError)
			})
	})
})
```

### Async (Message / Kafka) Consumer Test

The consumer test defines the message interaction and generates the pact file. Pact
serialises the message in memory — no Kafka broker is started. The consumer's handler
is invoked directly; Kafka wiring is an integration concern.

```typescript
import { PactV4, MatchersV3 } from "@pact-foundation/pact"
import path from "node:path"
import { handleOrderCreated } from "../src/orders/order-handler.js"

const { like, decimal } = MatchersV3

const provider = new PactV4({
	consumer: "ShippingService",
	provider: "OrderService",
	dir: path.resolve(process.cwd(), "pacts"),
})

describe("OrderService message consumer contract", () => {
	it("handles an order created event", async () => {
		await provider
			.addInteraction()
			.given("an order was placed")
			.uponReceiving("an order created event")
			.withAsynchronousBody((b) =>
				b
					.withJSONContent({ orderId: like("order-123"), amount: decimal(9.99) })
					.withMetadata({ "content-type": "application/json" })
			)
			.executeTest(async (message) => {
				const event = JSON.parse(message.contents.toString())
				await handleOrderCreated(event)
				expect(event.orderId).toBeDefined()
			})
	})
})
```

## Provider Verification Examples

### HTTP Provider Verification

The provider verification test runs against the real provider and replays each interaction
from the pact file. Provider state handlers seed any required test data before each
interaction. The `Verifier` class is the standard approach for HTTP provider verification.

```typescript
import { Verifier } from "@pact-foundation/pact"
import path from "node:path"

describe("UserService provider verification", () => {
	it("satisfies all consumer contracts", async () => {
		const verifier = new Verifier({
			provider: "UserService",
			providerBaseUrl: "http://localhost:3001",
			pactUrls: [path.resolve(process.cwd(), "pacts", "OrderService-UserService.json")],
			stateHandlers: {
				"user 42 exists": async () => {
					await seedDatabase({ id: 42, email: "alice@example.com", name: "Alice" })
				},
				"user 99 does not exist": async () => {
					await clearUser(99)
				},
			},
		})

		await verifier.verifyProvider()
	})
})
```

### Message Provider Verification

The `messageProviders` map keys must match the interaction description from the consumer
pact exactly. Each value is an async function returning the message the provider would
emit. `providerBaseUrl` is still required even for pure-message verification — Pact uses
it for state setup calls. Point it at the real service or a lightweight state-handler
server.

```typescript
import { Verifier } from "@pact-foundation/pact"
import path from "node:path"

describe("OrderService message provider verification", () => {
	it("satisfies all message consumer contracts", async () => {
		const verifier = new Verifier({
			provider: "OrderService",
			providerBaseUrl: "http://localhost:3001",
			pactUrls: [path.resolve(process.cwd(), "pacts", "ShippingService-OrderService.json")],
			stateHandlers: {
				"an order was placed": async () => {
					await seedOrder({ id: "order-123", amount: 9.99 })
				},
			},
			messageProviders: {
				"an order created event": async () => ({
					contents: JSON.stringify({ orderId: "order-123", amount: 9.99 }),
					metadata: { "content-type": "application/json" },
				}),
			},
		})

		await verifier.verifyProvider()
	})
})
```

## Pact Broker and CI Flow

In a multi-service repo or CI pipeline, pact files are published to a **Pact Broker** so
providers can fetch and verify them independently.

Typical CI flow:

1. **Consumer CI:** Run consumer tests → generate pact files → publish to broker.
2. **Provider CI:** Fetch pacts from broker → run provider verification → publish results.
3. **Can-I-Deploy:** Before deploying either side, query the broker to confirm all contracts
   are verified against the target environment.

These steps are implemented as Mise tasks and invoked via `mise run`:

```bash
mise run pact:publish   # consumer CI — publish pact files to the broker
mise run pact:deploy    # pre-deploy — confirm all contracts verified in target environment
```

Broker URL, token, and version strategy are configured in the Mise task definitions, not
as inline shell commands.

If no broker is in use (e.g., monorepo or simple two-service setup), pact files can be
committed directly to the repository and referenced by path in the provider verification
test.

## Relationship to Other Test Types

Contract tests complement integration tests but serve a different
purpose. Integration tests verify that an adapter correctly talks to
a real (or realistically simulated) dependency. Contract tests verify
that both sides of a boundary share the same understanding of the
interface.

In practice, a broken contract test often surfaces issues that would
otherwise only appear in end-to-end or staging environments.

Kafka transport wiring — connecting to a real broker, subscribing to topics, committing
offsets — belongs in integration tests, not contract tests.
