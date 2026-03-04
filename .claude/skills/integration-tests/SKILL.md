---
name: integration-tests
description: >
  Guidance on writing integration tests that verify adapters and
  boundaries work correctly with real, out-of-process external
  dependencies. Covers dev containers for owned infrastructure and
  over-the-wire mocks for sibling services. Consult when testing
  database access over a network, HTTP clients calling real or
  simulated services, message consumers, or any code that crosses
  a process boundary. The defining characteristic of an integration
  test is that it crosses a process boundary - if everything runs
  in a single process, see the unit-tests skill instead.
---

# Integration Tests

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

## Subcutaneous Integration Tests

A subcutaneous test becomes an integration test when the application
context is backed by real out-of-process infrastructure - a Postgres
container, a real message broker, a WireMock instance.

These tests exercise a broad slice of the application (routing,
validation, business logic, persistence) through its API or service
entry point, with real network calls to real dependencies. They catch
wiring, configuration, and middleware issues that unit tests miss.

## Scope and Speed

Integration tests are slower than unit tests by nature. Keeping their
scope focused - one adapter, one interaction pattern - helps maintain
a fast feedback loop.

Where a test requires extensive setup or exercises multiple adapters in
concert, consider whether the same confidence could be achieved more
efficiently at a different level.
