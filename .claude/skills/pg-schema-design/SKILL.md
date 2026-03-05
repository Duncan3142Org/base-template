---
name: pg-schema-design
description: "Use this skill when creating, altering, or reviewing PostgreSQL database schema. Triggers include: writing SQL migrations, defining new tables or columns, designing domain models for PostgreSQL persistence, creating or modifying custom types (composites, domains, enums, ranges), and scaffolding schema for a new service or library. Also activate when reviewing existing schema for anti-patterns or when any task involves co-generating TypeScript validation schemas alongside SQL DDL. Do NOT use for application-layer query building, ORM configuration, or non-PostgreSQL databases."
---

# PostgreSQL Schema Design

## Core Principle

Leverage the PostgreSQL type system to enforce type safety at the storage layer. The database must complement the application layer in preventing invalid states. Neither layer relies on the other - both independently validate and enforce system invariants.

## Co-Generation Rule

**Every migration must produce two artifacts:**

1. **SQL Migration** - the DDL defining types, tables, constraints, and indexes.
2. **Validation Schema** - a TypeScript runtime schema that mirrors the SQL types for marshalling query results into validated application types.

The validation library is project-dependent (likely Effect Schema, but may vary). If uncertain, ask which library is in use. Write validation schemas that:

- Map each composite type / domain to a dedicated schema.
- Enforce the same constraints expressed in SQL (e.g., if a domain has a CHECK regex, the schema has a matching pattern refinement).
- Are co-located with or clearly reference their corresponding migration.

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
- Register custom parsers/serializers in the driver layer to map directly to TypeScript interfaces.

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

## Validation Schema Co-Generation

When generating the SQL migration, also produce a validation schema file that mirrors the database types. The schema must:

1. **Map each custom type** (composite, domain, enum) to a named schema definition.
2. **Replicate constraints** - if the SQL has a CHECK, the schema has an equivalent refinement.
3. **Compose schemas** - domain-over-composite schemas should compose the base composite schema with additional refinements.
4. **Export parse functions** - each schema should export a function that accepts raw query output and returns a validated, typed result.

Example pattern (library-agnostic pseudocode, adapt to project's validation library):

```typescript
// Mirrors: CREATE DOMAIN common.email AS text CHECK (...)
const Email = pipe(
	StringSchema,
	pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/),
	brand("Email")
)

// Mirrors: CREATE TYPE common.date_window AS (start_at timestamptz, end_at timestamptz)
const DateWindow = struct({
	start_at: DateTimeSchema,
	end_at: DateTimeSchema,
})

// Mirrors: CREATE DOMAIN common.valid_window AS common.date_window CHECK (...)
const ValidWindow = pipe(
	DateWindow,
	refine((v) => v.start_at < v.end_at, "start_at must precede end_at")
)

// Mirrors: CREATE TYPE common.order_status AS ENUM (...)
const OrderStatus = literal(
	"draft",
	"submitted",
	"processing",
	"shipped",
	"delivered",
	"cancelled"
)
```

## Anti-Patterns to Reject

When reviewing or generating schema, flag and refuse the following:

- **Primitive obsession** - bare `TEXT` or `INTEGER` for values with semantic meaning (emails, currency amounts, IDs with format rules). Wrap in a domain.
- **Wide tables with repeated field groups** - extract into composite types.
- **Dual start/end columns for intervals** - use range types.
- **JSONB for known structures** - use composite types or normalized tables.
- **Foreign keys inside JSONB** - always use proper FK columns with referential constraints.
- **ENUMs for frequently changing value sets** - use a lookup table with a FK instead.
- **Missing exclusion constraints on range columns** - if overlaps are invalid, enforce it.
