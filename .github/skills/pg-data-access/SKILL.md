---
name: pg-data-access
description: "Postgres concurrency control and data consistency patterns. Use this skill when writing or reviewing transactional data access code — row locking (SELECT ... FOR UPDATE), isolation level selection (READ COMMITTED vs SERIALIZABLE), deadlock prevention, retry logic, or diagnosing concurrency anomalies (phantom reads, write skew, serialization failures). For schema design (FK constraints, cascade strategies, index design), see `pg-schema-design`."
---

# Postgres Data Access & Consistency

These are mandatory conventions for all Postgres data access code. They apply regardless of
ORM or query builder - the principles operate at the SQL and transaction level. Use the
**Decision Flowchart** at the end of this document as the canonical entry point when choosing
a concurrency strategy.

## 1. Schema Foundations

The concurrency strategies in this skill depend on correct schema design — foreign key
constraints with appropriate cascade behavior, indexes on FK columns, and locking-efficiency
indexes on every column used in `FOR UPDATE` or `SERIALIZABLE` queries. These are schema-level
concerns defined in `pg-schema-design` (see its **Referential Integrity** and **Index Design**
sections). Ensure those foundations are in place before applying the concurrency patterns below.

## 2. Concurrency Control Strategies

There are two strategies. Choose based on whether the target rows are known to exist.

### Primary: Pessimistic Locking for Known Entities

**When:** Standard CRUD operations where the resource identifier is provided and the record is
expected to exist (mutation of a known entity).

**How:** Use `READ COMMITTED` isolation with `SELECT ... FOR UPDATE`.

**Lock ordering:** Strictly enforce Parent -> Child locking order. Always lock the Aggregate Root
before locking its dependents. This prevents deadlocks from inconsistent acquisition order.

**Example pattern (ORM-agnostic SQL):**

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Lock parent first
SELECT * FROM orders WHERE id = $1 FOR UPDATE;

-- Then lock children
SELECT * FROM order_items WHERE order_id = $1 FOR UPDATE;

-- Mutate safely
UPDATE order_items SET quantity = $2 WHERE id = $3;

COMMIT;
```

### Secondary: Serializable Isolation for Gap Protection

**When:** Business logic depends on the **absence** of data (e.g., "is this address orphaned?",
"ensure count < 5"), or the parent entity is not yet known. Row-level locks cannot protect
"gaps" - rows that don't exist yet.

**How:** Use `SERIALIZABLE` isolation.

This protects against Phantom Reads and Write Skew anomalies that `READ COMMITTED` allows.

**Example pattern:**

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- This read is protected against phantoms
SELECT count(*) FROM subscriptions WHERE user_id = $1 AND status = 'active';

-- Safe to insert if count check passed
INSERT INTO subscriptions (user_id, plan_id, status) VALUES ($1, $2, 'active');

COMMIT;
```

### Hybrid Optimization: The "Blocking" Pattern

When modifying data within a `SERIALIZABLE` transaction, acquire `PESSIMISTIC_WRITE` locks on
relevant existing rows early in the transaction.

Why this helps: It forces concurrent `READ COMMITTED` transactions to **block** (wait) rather
than race ahead and conflict. This significantly reduces serialization failures (`40001` aborts)
and often eliminates the need for application-side retry logic.

**Example pattern:**

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Eagerly lock existing rows to force concurrent transactions to wait
SELECT * FROM subscriptions WHERE user_id = $1 FOR UPDATE;

-- Gap-protected read
SELECT count(*) FROM subscriptions WHERE user_id = $1 AND status = 'active';

-- Proceed with mutation
INSERT INTO subscriptions (user_id, plan_id, status) VALUES ($1, $2, 'active');

COMMIT;
```

## 3. Transaction Isolation & Scope

### Explicit Isolation Levels

Explicitly declare an isolation level for every transaction. Do not rely on implicit defaults.

When working in existing code that omits the isolation level, assume `READ COMMITTED` as the
effective default - but add the explicit declaration when modifying the code.

### Retry Logic

**Mandatory** for long-running or high-contention transactions (e.g., inventory allocation,
batch processing). These are likely to encounter serialization failures or lock timeouts.

**Optional** for short-lived, low-contention transactions that use the Hybrid Optimization above.
In these cases, failing with a system error on the rare edge case is an acceptable trade-off
for code simplicity. Document this decision with a comment when choosing not to retry.

### Statement Timeout

For long-running or high-contention transactions, set a `statement_timeout` to avoid
indefinite waits on a blocked lock:

```sql
SET LOCAL statement_timeout = '5s';
```

Setting the timeout locally scopes it to the current transaction only. Choose a value longer
than your expected worst-case lock wait time but short enough to surface pathological cases
rather than silently hanging the application.

### Transaction Scope

Keep transactions as small as possible. Encompass only the operations necessary to maintain
consistency - no network calls, no external API requests, no user-facing I/O inside a transaction.

## 4. Deadlock Prevention

### Intra-Table: Deterministic Row Ordering

When locking multiple rows in the same table, always use deterministic ordering:

```sql
SELECT * FROM line_items
WHERE order_id = $1
ORDER BY id ASC
FOR UPDATE;
```

Without this, two concurrent transactions locking the same rows in different order will deadlock.

### Inter-Table: Global Lock Hierarchy

**For pessimistic (`READ COMMITTED`) scopes:** Enforce a strict global hierarchy - always
Parent -> Child. Every developer must follow the same order.

**For hybrid/serializable scopes:** Follow the hierarchy where possible, but prioritize logical
flow. The database's cycle detection will abort one transaction if a deadlock occurs - this is
acceptable in serializable scopes since retry logic (or the hybrid optimization) handles it.

## Decision Flowchart

When writing or reviewing a data access operation, follow this sequence:

1. **Is the target row known to exist?**
   - Yes -> Use **Primary Strategy** (READ COMMITTED + FOR UPDATE)
   - No, or logic depends on absence of data -> Use **Secondary Strategy** (SERIALIZABLE)

2. **Does the SERIALIZABLE transaction also modify existing rows?**
   - Yes -> Apply the **Hybrid Optimization** (early FOR UPDATE within SERIALIZABLE)
   - No -> Plain SERIALIZABLE is sufficient

3. **Is the transaction long-running or high-contention?**
   - Yes -> Retry logic is **mandatory**
   - No, and using Hybrid -> Retry is **optional** (document the decision)

4. **Multiple rows or tables being locked?**
   - Same table -> `ORDER BY id ASC`
   - Multiple tables -> Parent -> Child order

5. **Pre-flight:** Confirm every locked column has an index (`EXPLAIN` the query).
