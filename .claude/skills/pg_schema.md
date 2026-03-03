# PostgreSQL Data Types

**Core Principle:** Leverage the PostgreSQL type system to encourage type safety. The database must compliment the application layer in preventing invalid states. The application layer must not rely on the DB data types to enforce data integrity, both systems should respect system invariants and perform validation.

## Composite Types (Grouped Fields)

**Definition:** Custom types that group multiple fields into a single logical unit (e.g., `Address`, `Money`, `PointInTime`).

- **Mandate:** Use these for structured data that always travels together. This reduces table width and enforces the presence of internal fields.

- **Driver Strategy:** When using `postgres.js` (or similar modern drivers), register custom parsers/serializers to map these types directly to **TypeScript Interfaces**.

- **Performance:** Prefer over `JSONB` for static structures to reduce storage size (no repeated keys) and parsing overhead.

## Domains over Scalar (Semantic Primitives)

**Definition:** A base type (like `TEXT` or `INT`) with strict `CHECK` constraints attached.

- **Application:** Use for **Email Addresses**, **Phone Numbers**, **Postal Codes**, **SKUs**, or **Positive Integers**.

- **Benefit:** Prevents "Primitive Obsession." Centralizes validation logic (e.g., Regex) in the schema, protecting data from inconsistent application-side validation.

## Domain over Composite (Object Validation)

**Pattern:** Wrapping a `DOMAIN` around a `COMPOSITE TYPE` to enforce logic that involves multiple fields (cross-column constraints).

- **Use Case:** Validating relationships between fields within a single object (e.g., `start_time` must be before `end_time`).

- **Syntax:** Use `(VALUE).field_name` to access internal fields within the `CHECK` constraint.

- **Example:**

  ```sql

  -- 1. Define the Composite Structure

  CREATE TYPE common.date_window AS (

    start_at timestamptz,

    end_at   timestamptz

  );



  -- 2. Define a Domain OVER that Composite

  CREATE DOMAIN common.valid_window AS common.date_window

    CHECK (

      (VALUE).start_at < (VALUE).end_at

    );

  ```

- **Benefit:** Enforces state consistency at the atomic object level, preventing invalid data structures from ever being instantiated in memory or on disk.

## Range Types (Interval Management)

**Definition:** Specialized types for handling intervals of data (Time, Dates, Integers).

- **Integrity:** Must be paired with **GIST Indexing** and **Exclusion Constraints** to enforce non-overlapping rules (e.g., ensuring a room cannot be double-booked).

- **Efficiency:** Significantly more performant than dual-column (`start`, `end`) logic for overlap and containment queries.

## Enumerated Types (ENUMs)

**Definition:** A static, ordered set of allowed values.

- **Application:** Use for state fields with a fixed lifecycle (e.g., `user_role`, `order_status`).

- **Performance:** Stored as 4-byte integers, offering significant storage and index size reductions compared to `VARCHAR`.

- **Constraint:** Only use for values that are relatively stable or can be simply extended; altering ENUMs can be operationally complex.

## JSONB (The "Schemaless" Exception)

**Definition:** Binary JSON storage. **Do not** use as a default for lazy modeling.

- **Valid Use Cases:**
  - **Dynamic Attributes:** E.g., Product specs that vary wildly by category.

  - **Third-Party Payloads:** Storing raw webhooks (Stripe, Slack) for audit trails.

  - **Draft State:** Temporary storage of multi-step forms where validation is suspended.

- **Anti-Patterns:**
  - Querying deeply nested fields in high-throughput paths.

  - Storing Foreign Keys inside JSON (breaks Referential Integrity).

## Decision Matrix

| Requirement | Preferred Type | Rationale |

| :------------------------ | :------------- | :------------------------------------------- |

| **Nested, Stable Data** | Composite Type | Enforces structure; efficient storage. |

| **Strict Formatting** | Domain | Centralizes validation; prevents bad input. |

| **Time/Number Intervals** | Range Type | Enables overlap protection via GIST indexes. |

| **Fixed State Labels** | ENUM | High performance; ensures valid transitions. |

| **Unpredictable Schema** | JSONB | Flexibility for dynamic or external data. |
