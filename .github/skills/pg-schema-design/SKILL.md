---
name: pg-schema-design
description: "Use this skill when creating, altering, or reviewing PostgreSQL database schema. Triggers include: writing SQL migrations, defining new tables or columns, designing domain models for PostgreSQL persistence, creating or modifying custom types (composites, domains, enums, ranges), defining foreign key constraints and cascade strategies, designing indexes (B-tree, GiST, GIN, partial, covering), and scaffolding schema for a new service or library. Also activate when reviewing existing schema for anti-patterns. Do NOT use for application-layer query building, ORM configuration, or non-PostgreSQL databases. For transactional concurrency patterns (locking, isolation levels), see `pg-data-access`."
---

# PostgreSQL Schema Design

## Core Principle

Leverage the PostgreSQL type system to enforce type safety at the storage layer. The database must complement the application layer in preventing invalid states. Neither layer relies on the other - both independently validate and enforce system invariants.

## Type Selection Rules

When designing schema, choose types using these rules in priority order:

1. **Data is a group of fields that always travel together** -> Define a **Composite Type**. Examples: `Address`, `Money`, `GeoPoint`.

2. **A scalar value has strict formatting or semantic meaning** -> Define a **Domain over Scalar**. Examples: `Email`, `PhoneNumber`, `PostalCode`, `PositiveInt`, `SKU`.

3. **A composite value has cross-field invariants** -> Define a **Domain over Composite**. Examples: a `DateWindow` where `start_at < end_at`, a `PriceRange` where `min <= max`.

4. **Data represents a time, date, or numeric interval requiring overlap protection** -> Use a **Range Type** with a GIST index and exclusion constraint.

5. **A field has a small, stable set of allowed values** -> Use an **ENUM**. Examples: `user_role`, `order_status`. Only use when the set is unlikely to change frequently, and can be extended rather than reordered.

6. **Structure is genuinely dynamic or externally defined** -> Use **JSONB**. Valid cases: variable product attributes, raw third-party webhook payloads, draft/in-progress form state.

If none of the above apply, use standard scalar types (`TEXT`, `INTEGER`, `TIMESTAMPTZ`, etc.) with appropriate `NOT NULL` and `CHECK` constraints.

## Type Implementation Reference

### Composite Types

Group related fields into a named type. Prefer over JSONB for any structure that is known at design time.

```sql
CREATE TYPE common.address AS (
  line1   text,
  line2   text,
  city    text,
  region  text,
  postal  text,
  country text
);
```

- Reduces table width and enforces internal field presence.
- More storage-efficient than JSONB (no repeated key names).

### Domains over Scalars

Wrap a base type with a CHECK constraint to create a semantic primitive.

```sql
CREATE DOMAIN common.email AS text
  CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

CREATE DOMAIN common.positive_int AS integer
  CHECK (VALUE > 0);
```

- Centralizes validation logic in the schema.
- Eliminates primitive obsession - an `email` column cannot silently accept arbitrary text.

### Domains over Composites

Apply cross-field validation to a composite type.

```sql
CREATE TYPE common.date_window AS (
  start_at timestamptz,
  end_at   timestamptz
);

CREATE DOMAIN common.valid_window AS common.date_window
  CHECK ((VALUE).start_at < (VALUE).end_at);
```

- Use `(VALUE).field_name` syntax to access fields inside the CHECK.
- Prevents structurally invalid objects from being instantiated in the database.

### Range Types

Use for interval data requiring overlap or containment queries.

```sql
-- Column definition
booked_during tstzrange NOT NULL,

-- GIST index for efficient range queries
CREATE INDEX idx_bookings_during ON bookings USING GIST (booked_during);

-- Exclusion constraint to prevent overlapping bookings per room
ALTER TABLE bookings
  ADD CONSTRAINT no_double_booking
  EXCLUDE USING GIST (room_id WITH =, booked_during WITH &&);
```

- Always pair with a GIST index.
- Always define exclusion constraints when overlaps are invalid.
- Significantly outperforms dual-column (start/end) patterns for overlap checks.

### ENUMs

Define a fixed, ordered set of allowed values.

```sql
CREATE TYPE common.order_status AS ENUM (
  'draft', 'submitted', 'processing', 'shipped', 'delivered', 'cancelled'
);
```

- Stored as 4-byte integers - compact in storage and indexes.
- Only use for value sets that are stable. Adding values is straightforward (`ALTER TYPE ... ADD VALUE`), but removing or reordering is operationally complex.

### JSONB

Reserve for genuinely dynamic or externally-sourced data.

```sql
-- Third-party webhook payload
raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,

-- Variable product attributes
attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
```

**Anti-patterns to reject:**

- Querying deeply nested JSONB fields in hot paths.
- Storing foreign keys inside JSON (breaks referential integrity).
- Using JSONB for data with a known, stable structure (use composite types instead).

## Referential Integrity

### Foreign Key Constraints

Use hard Foreign Key constraints for all relational associations. Never rely on application code alone to enforce referential integrity — the database must independently guarantee that every reference points to a valid parent row.

```sql
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order
  FOREIGN KEY (order_id) REFERENCES orders (id)
  ON DELETE RESTRICT;
```

### Cascade Strategy Selection

Choose the `ON DELETE` behavior based on the relationship semantics. Apply the first matching rule:

1. **`RESTRICT` (default)** — Parent deletion is a programming error. The application must explicitly reassign or delete children before removing the parent. Use for the vast majority of associations.

2. **`CASCADE`** — Child rows have no independent meaning without the parent (true part-of relationship). Examples: `order_items` when an `order` is deleted, `comment_reactions` when a `comment` is deleted. Use sparingly — silent mass deletion is dangerous.

3. **`SET NULL`** — The association is optional and should become unset when the parent disappears. The FK column **must** be nullable. Example: `created_by` user reference on a resource that should survive user deletion.

4. **`SET DEFAULT`** — Rarely appropriate. Only use when a meaningful sentinel/default value exists for the FK column. Example: reassigning orphaned rows to a system account.

5. **`NO ACTION DEFERRABLE INITIALLY DEFERRED`** — The constraint check is postponed to transaction commit time. Use for circular dependencies or multi-step operations where rows are temporarily orphaned within a single transaction.

```sql
-- Circular dependency between tables
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_manager
  FOREIGN KEY (manager_id) REFERENCES employees (id)
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE employees
  ADD CONSTRAINT fk_employees_department
  FOREIGN KEY (department_id) REFERENCES departments (id)
  DEFERRABLE INITIALLY DEFERRED;
```

### FK Indexing Rules

**Always index the referencing (child) column of every foreign key.** PostgreSQL does NOT auto-create these indexes. Missing FK indexes cause two problems:

1. **Join performance** — queries joining parent to children degrade to sequential scans on the child table.
2. **Lock escalation on parent deletes** — when a parent row is deleted (or its PK is updated), PostgreSQL must check for referencing child rows. Without an index on the FK column, this check acquires a `ShareLock` on the entire child table, blocking all concurrent inserts and updates.

```sql
-- FK definition
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order
  FOREIGN KEY (order_id) REFERENCES orders (id);

-- REQUIRED: index on the referencing column
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
```

## Index Design

### Index Type Selection

Choose the index type based on the data and query pattern. Apply the first matching rule:

1. **B-tree (default)** — Equality, range, sorting, and prefix queries on scalar types. Supports all comparison operators (`=`, `<`, `>`, `BETWEEN`, `IS NULL`). Use when no other type is specifically needed.

2. **GiST** — Range types, spatial/geometric data, and exclusion constraints. Required for `&&` (overlap), `@>` (contains), and `EXCLUDE USING GIST` constraints. Pair with range columns and PostGIS geometry.

3. **GIN** — JSONB containment (`@>`), array overlap (`&&`/`@>`), and full-text search (`@@`). Handles multi-valued data where a single row matches multiple keys. Slower to update than B-tree; best for read-heavy workloads.

4. **Hash** — Pure equality lookups only (`=`). Smaller than B-tree for large values but does not support range queries, sorting, or multi-column indexes. Rarely the right choice — prefer B-tree unless benchmarks prove a measurable advantage.

```sql
-- B-tree (default, most common)
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- GiST for range overlap
CREATE INDEX idx_bookings_during ON bookings USING GIST (booked_during);

-- GIN for JSONB containment
CREATE INDEX idx_products_attrs ON products USING GIN (attributes);

-- GIN for full-text search
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);
```

### Composite Index Column Ordering

Column order in a composite index determines which queries it can serve. Follow this ordering:

1. **Equality columns first** — columns compared with `=`.
2. **Most selective equality column leftmost** — the column with the highest cardinality (most distinct values) goes first among the equality columns.
3. **Range columns last** — columns compared with `<`, `>`, `BETWEEN`, or used in `ORDER BY`.

The index is usable for any left-prefix of its columns. A query that filters only on the first column still benefits; a query that filters only on the second column does not.

```sql
-- Query: WHERE tenant_id = $1 AND status = $2 AND created_at > $3
-- tenant_id = equality (high cardinality), status = equality (low cardinality), created_at = range
CREATE INDEX idx_orders_tenant_status_created
  ON orders (tenant_id, status, created_at);
```

### Covering Indexes (INCLUDE)

Add non-key columns with `INCLUDE` to enable index-only scans — the query reads everything it needs from the index without touching the heap.

- Only include narrow, frequently selected columns (integers, timestamps, short enums).
- Do **not** include wide columns (`TEXT`, `JSONB`, large `BYTEA`) — they bloat the index and negate the performance benefit.

```sql
-- Query: SELECT id, total FROM orders WHERE tenant_id = $1 AND status = 'active'
CREATE INDEX idx_orders_tenant_status_covering
  ON orders (tenant_id, status) INCLUDE (total);
```

### Partial Indexes for Business Rules

Use a `WHERE` clause to index only a subset of rows. Partial indexes are smaller, faster, and can enforce subset uniqueness that a full-table index cannot.

```sql
-- Enforce: one active subscription per user
CREATE UNIQUE INDEX idx_one_active_sub_per_user
  ON subscriptions (user_id)
  WHERE status = 'active';

-- Index only open orders (skip the 95% that are closed)
CREATE INDEX idx_orders_open
  ON orders (created_at)
  WHERE status != 'closed';
```

### Locking-Efficiency Indexes

Every column used in a `WHERE` clause for `SELECT ... FOR UPDATE` or within a `SERIALIZABLE` transaction **must** be indexed. Without an index, the database may resort to a sequential scan, escalating row-level locks to table-level locks — this kills concurrency and causes widespread deadlocks.

**Pre-flight check:** Before deploying any locking query, verify the query plan uses an index:

```sql
EXPLAIN SELECT * FROM orders WHERE id = $1 FOR UPDATE;
```

If the plan shows a sequential scan, add the missing index before writing the locking query. For concurrency control patterns that depend on these indexes, see `pg-data-access`.

## Anti-Patterns to Reject

When reviewing or generating schema, flag and refuse the following:

- **Primitive obsession** - bare `TEXT` or `INTEGER` for values with semantic meaning (emails, currency amounts, IDs with format rules). Wrap in a domain.
- **Wide tables with repeated field groups** - extract into composite types.
- **Dual start/end columns for intervals** - use range types.
- **JSONB for known structures** - use composite types or normalized tables.
- **Foreign keys inside JSONB** - always use proper FK columns with referential constraints.
- **ENUMs for frequently changing value sets** - use a lookup table with a FK instead.
- **Missing exclusion constraints on range columns** - if overlaps are invalid, enforce it.
- **Missing index on FK columns** - PostgreSQL does not auto-create indexes on referencing columns. Every FK must have a corresponding index.
- **CASCADE on all foreign keys** - silent mass deletion risk. Default to RESTRICT; only use CASCADE for true part-of relationships.
- **Wrong index type** - B-tree on JSONB containment queries (use GIN), GIN on scalar range queries (use B-tree), Hash for anything beyond pure equality.
- **Range column in middle of composite index** - range columns must be last; placing them before equality columns prevents the index from serving the trailing equality filters.
- **Covering index with wide columns** - including TEXT, JSONB, or large BYTEA in INCLUDE bloats the index and negates index-only scan benefits.
