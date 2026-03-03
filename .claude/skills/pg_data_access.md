# Postgres Data Access & Consistency:

## Structural Integrity & Performance

Before applying concurrency controls, ensure the schema enforces integrity through the database engine itself.

- Foreign Keys (FKs):
  - **Mandate:** Use hard Foreign Key constraints for all relational associations.

  - Referential Integrity: Utilise `ON DELETE RESTRICT` by default to prevent accidental data loss. Apply `ON DELETE NO ACTION DEFERRABLE` only when required by circular dependencies or logic which necessitates that a row to be orphaned temporarily.

- Indexing Strategy:
  - Constraint-Led: Use UNIQUE indexes to enforce business rules (e.g., "one active subscription per user") rather than checking via application code.

  - Locking Efficiency: Every column used in a WHERE clause for SELECT ... FOR UPDATE or within a SERIALIZABLE transaction must be indexed.

  - Why: Without an index, the DB may resort to a full table scan, escalating row locks to table locks, which kills concurrency and causes widespread deadlocks.

## Concurrency Control Strategies

_Pre-flight Check: Ensure the query plan utilizes an index before applying pessimistic locks._

- **Primary Strategy: Mutation of Known Entities**
  - **Use Case:** Standard CRUD operations where the resource identifier is provided and the record is expected to exist.

  - **Mandate:** Use `READ COMMITTED` with `SELECT ... FOR UPDATE` (Pessimistic Locking).

  - **Hierarchy:** Strictly enforce **Parent -> Child** locking order. Lock the Aggregate Root before its dependents.

- **Secondary Strategy: State-Dependent Logic & Gap Protection**
  - **Use Case:** Business logic relying on the **absence** of data (e.g., "is this address orphaned?", "ensure count < 5"), or operations where the parent entity is not yet known.

  - **Mandate:** Use `SERIALIZABLE` isolation.
    - _Why:_ Locks cannot protect "gaps" (missing rows). `SERIALIZABLE` protects against Phantom Reads and Write Skew anomalies that `READ COMMITTED` allows.

  - **Hybrid Optimization (The "Blocking" Pattern):**
    - When modifying data within a `SERIALIZABLE` transaction, attempt to acquire `PESSIMISTIC_WRITE` locks on relevant rows early.

    - _Benefit:_ This forces concurrent `READ COMMITTED` transactions to **wait** (block) rather than race. This significantly reduces the probability of serialization failures (`40001` aborts) and negates the need for application-side retry logic in most scenarios.

## Transaction Isolation & Scope

- **Explicit Opt-In:** Explicitly declare an isolation level for all queries.

- **Default Isolation:** Assume `READ COMMITTED` is the default isolation level for queries, when existing code does not make it explicit.

- **Retry Logic:**
  - **Mandatory:** If the transaction is long-running or high-contention (e.g., inventory allocation).

  - **Optional:** If the transaction is short-lived, low-contention, and utilizes the "Hybrid Optimization" above. Failing with a system error in rare edge cases is an acceptable trade-off for code simplicity.

- **Atomic Scope:** Ensure transactions encompass the smallest scope necessary to maintain consistency.

## Deadlock Prevention

- **Intra-Table Ordering:** When locking multiple rows in one table, strictly enforce deterministic ordering (e.g., `ORDER BY id ASC`).

- **Inter-Table Ordering:**
  - **Pessimistic Scopes:** Enforce strict global hierarchy (Parent -> Child).

  - **Hybrid/Serializable Scopes:** Attempt to follow hierarchy where possible, but prioritize logical flow. Rely on the database's cycle detection to abort deadlocks if they occur.
