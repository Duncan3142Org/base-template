---
name: contract-tests
description: >
  How to write consumer-driven contract tests with Pact.js. Use this skill whenever testing
  API boundaries between services — ensuring a consumer's expectations of a provider are
  codified and verified. Covers Pact.js setup, consumer interaction definitions, provider
  verification, pact broker CI flow, and where contracts live. If you need to verify adapter
  wiring with a real service, see `integration-tests` instead.
---

# Contract Tests

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
the `PactV3` API for HTTP pacts.

```bash
npm install --save-dev @pact-foundation/pact
```

Generated pact files live in a `pacts/` directory at the repository root. This directory
is either committed directly or published to a Pact Broker as part of the CI pipeline.

## What to Cover

- Request/response shape: required fields, types, status codes.
- Semantic meaning of key fields where ambiguity exists.
- Error responses the consumer is expected to handle.

Contract tests focus on the _agreement_, not on business logic. They
are typically lightweight and fast.

## What to Avoid

- Reimplementing provider logic in the consumer's test suite.
- Asserting on fields the consumer doesn't use.
- Treating contract tests as a substitute for the provider's own
  unit or integration tests.

## Consumer Test Example

The consumer test defines the interaction and generates the pact file. Tests run against
a local mock server provided by Pact — no real provider needed at this stage.

```typescript
import { PactV3, MatchersV3 } from "@pact-foundation/pact"
import path from "node:path"
import { fetchUser } from "../src/users/user-client.js"

const { like, string } = MatchersV3

const provider = new PactV3({
  consumer: "OrderService",
  provider: "UserService",
  dir: path.resolve(process.cwd(), "pacts"),
})

describe("UserService consumer contract", () => {
  it("returns a user by id", async () => {
    await provider
      .given("user 42 exists")
      .uponReceiving("a GET request for user 42")
      .withRequest({ method: "GET", url: "/users/42" })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          id: like(42),
          email: string("alice@example.com"),
          name: like("Alice"),
        },
      })
      .executeTest(async (mockServer) => {
        const user = await fetchUser(mockServer.url, 42)
        expect(user.id).toBe(42)
        expect(user.email).toBeDefined()
      })
  })

  it("returns 404 when user does not exist", async () => {
    await provider
      .given("user 99 does not exist")
      .uponReceiving("a GET request for a missing user")
      .withRequest({ method: "GET", url: "/users/99" })
      .willRespondWith({ status: 404 })
      .executeTest(async (mockServer) => {
        await expect(fetchUser(mockServer.url, 99)).rejects.toThrow(UserNotFoundError)
      })
  })
})
```

## Provider Verification Example

The provider verification test runs against the real provider and replays each interaction
from the pact file. Provider state handlers seed any required test data before each
interaction.

```typescript
import { Verifier } from "@pact-foundation/pact"
import path from "node:path"

describe("UserService provider verification", () => {
  it("satisfies all consumer contracts", async () => {
    const verifier = new Verifier({
      provider: "UserService",
      providerBaseUrl: "http://localhost:3001",
      pactUrls: [
        path.resolve(process.cwd(), "pacts", "OrderService-UserService.json"),
      ],
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

## Pact Broker and CI Flow

In a multi-service repo or CI pipeline, pact files are published to a **Pact Broker** so
providers can fetch and verify them independently.

Typical CI flow:

1. **Consumer CI:** Run consumer tests → generate pact files → publish to broker.
2. **Provider CI:** Fetch pacts from broker → run provider verification → publish results.
3. **Can-I-Deploy:** Before deploying either side, query the broker to confirm all contracts
   are verified against the target environment.

```bash
# Publish pacts (consumer CI)
npx pact-broker publish pacts/ \
  --broker-base-url "$PACT_BROKER_URL" \
  --broker-token "$PACT_BROKER_TOKEN" \
  --consumer-app-version "$GIT_SHA"

# Check deployability
npx pact-broker can-i-deploy \
  --pacticipant OrderService \
  --version "$GIT_SHA" \
  --to-environment production
```

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
