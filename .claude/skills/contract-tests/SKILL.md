---
name: contract-tests
description: >
  Guidance on writing contract tests that verify agreements between
  services. Consult when testing API boundaries, consumer-driven
  contracts, or ensuring that a service's expectations of a dependency
  match what the dependency actually provides. Pairs with the
  testing-philosophy skill for broader context.
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

## Relationship to Other Test Types

Contract tests complement integration tests but serve a different
purpose. Integration tests verify that an adapter correctly talks to
a real (or realistically simulated) dependency. Contract tests verify
that both sides of a boundary share the same understanding of the
interface.

In practice, a broken contract test often surfaces issues that would
otherwise only appear in end-to-end or staging environments.
