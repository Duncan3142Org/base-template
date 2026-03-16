---
name: hexagonal-ddd
description: "Hexagonal Architecture (Ports and Adapters) combined with Domain-Driven Design for structuring services with a clean, framework-independent domain core. Load this skill when designing a new service or module, defining domain models, placing new code in the right layer, or reviewing whether dependencies point in the correct direction. Covers ports, adapters, dependency direction, DDD entities/value objects/aggregates/repositories, and how the two patterns combine. Pairs with `solid-principles` for class-level design."
---

# Hexagonal Architecture + Domain-Driven Design

These two patterns complement each other: DDD defines _what_ lives in the domain core;
Hexagonal Architecture defines _how_ the core connects to the outside world.

## Hexagonal Architecture

### The Core Idea

The application is structured as three concentric layers:

```
┌─────────────────────────────────────────┐
│  Infrastructure (Adapters)              │
│  ┌───────────────────────────────────┐  │
│  │  Application (Use Cases / Ports)  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │     Domain (Core Logic)     │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**The dependency rule:** all dependencies point _inward_. Infrastructure depends on
Application; Application depends on Domain. Domain depends on nothing outside itself.

### Ports

Ports are interfaces defined at the application/domain boundary. There are two kinds:

- **Driving (primary) ports** — interfaces the outside world calls to drive the
  application. Example: a use-case interface like `RegisterUser`.
- **Driven (secondary) ports** — interfaces the application calls to reach external
  systems. Example: `UserRepository`, `EmailSender`, `EventPublisher`.

Driven ports are defined _inside_ the application or domain layer (not in
infrastructure). This is the key inversion: the domain owns the contract; infrastructure
provides the implementation.

```typescript
// Driven port — defined in the domain/application layer
export interface UserRepository {
	findById(id: UserId): Promise<User | null>
	findByEmail(email: Email): Promise<User | null>
	save(user: User): Promise<void>
}

// Driving port — the application use case
export interface RegisterUser {
	execute(command: RegisterUserCommand): Promise<UserId>
}
```

### Adapters

Adapters live in the infrastructure layer and implement ports:

```typescript
// Secondary adapter: database implementation of the driven port
export class PostgresUserRepository implements UserRepository {
	constructor(private readonly db: DatabaseClient) {}

	async findById(id: UserId): Promise<User | null> {
		const row = await this.db.queryOne("SELECT * FROM users WHERE id = $1", [id.value])
		return row ? UserMapper.toDomain(row) : null
	}

	async save(user: User): Promise<void> {
		const row = UserMapper.toRow(user)
		await this.db.query(
			"INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE ...",
			[row.id, row.email, row.password_hash]
		)
	}
}

// Primary adapter: HTTP controller that drives the application
export class UserHttpController {
	constructor(private readonly registerUser: RegisterUser) {}

	async handlePost(req: Request): Promise<Response> {
		const userId = await this.registerUser.execute({ email: req.body.email })
		return { status: 201, body: { id: userId.value } }
	}
}
```

### Why This Matters for Testing

The domain core and application use cases can be tested without any infrastructure — no
database, no HTTP server. Inject an in-memory implementation of the driven port:

```typescript
// In-memory adapter for tests (lives in src/, not test/)
export class InMemoryUserRepository implements UserRepository {
	private readonly store = new Map<string, User>()

	async findById(id: UserId) {
		return this.store.get(id.value) ?? null
	}
	async save(user: User) {
		this.store.set(user.id.value, user)
	}
}
```

---

## Domain-Driven Design

### Value Objects

A value object represents a concept with no identity — it is defined entirely by its
value. Two value objects with the same value are equal. Value objects are immutable.

```typescript
export class Email {
	private constructor(private readonly value: string) {}

	static parse(raw: string): Email {
		if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(raw)) {
			throw new InvalidEmailError(raw)
		}
		return new Email(raw)
	}

	equals(other: Email): boolean {
		return this.value === other.value
	}
	toString(): string {
		return this.value
	}
}
```

Prefer value objects over primitive strings and numbers for domain concepts. `Email`,
`Money`, `Quantity`, `UserId`, `OrderStatus` — these should be typed, not bare primitives.

### Entities

An entity has a distinct identity that persists across state changes. Two entities are
equal if and only if their identities are equal, regardless of their current state.

```typescript
export class User {
	constructor(
		public readonly id: UserId,
		private email: Email,
		private readonly createdAt: Date,
		private readonly events: DomainEvent[] = []
	) {}

	changeEmail(newEmail: Email): void {
		if (this.email.equals(newEmail)) return
		this.email = newEmail
		this.events.push(new EmailChangedEvent(this.id, newEmail))
	}

	getEmail(): Email {
		return this.email
	}
	pullEvents(): DomainEvent[] {
		return this.events.splice(0)
	}
}
```

### Aggregates

An aggregate is a cluster of entities and value objects treated as a single unit for
data changes. The **aggregate root** is the only object in the cluster that outside code
holds a reference to. All mutations go through the root.

Aggregates enforce internal invariants — business rules that involve multiple parts of
the cluster.

```typescript
export class Order {
	private status: OrderStatus = OrderStatus.Draft
	private readonly items: OrderItem[] = []
	private readonly events: DomainEvent[] = []

	constructor(
		public readonly id: OrderId,
		private readonly customerId: CustomerId
	) {}

	addItem(productId: ProductId, quantity: Quantity): void {
		if (this.status !== OrderStatus.Draft) throw new OrderAlreadySubmittedError()
		this.items.push(new OrderItem(productId, quantity))
	}

	submit(): void {
		if (this.items.length === 0) throw new EmptyOrderError()
		this.status = OrderStatus.Submitted
		this.events.push(new OrderSubmittedEvent(this.id, this.customerId))
	}

	pullEvents(): DomainEvent[] {
		return this.events.splice(0)
	}
}
```

**Aggregate design rules:**

- Keep aggregates small. One aggregate root + a handful of child entities.
- Reference other aggregates by identity only (store `customerId`, not `Customer`).
- One transaction = one aggregate. If a use case needs to modify two aggregates, use
  eventual consistency (domain events) rather than a cross-aggregate transaction.

### Repositories

A repository is the driven port through which the application loads and persists aggregates.
It is defined in the domain/application layer and implemented in infrastructure.

```typescript
// Domain layer: defines the contract
export interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>
  save(order: Order): Promise<void>
}

// Infrastructure layer: implements the contract
export class PostgresOrderRepository implements OrderRepository {
  async findById(id: OrderId): Promise<Order | null> { ... }
  async save(order: Order): Promise<void> { ... }
}
```

Repositories work with aggregates, not raw tables. They reconstruct the full aggregate
from storage and persist state changes atomically.

### Domain Services

When a business operation doesn't naturally belong to a single entity or aggregate — for
example, transferring funds between two accounts — it belongs in a domain service.

```typescript
export class TransferService {
	transfer(from: Account, to: Account, amount: Money): void {
		from.debit(amount)
		to.credit(amount)
	}
}
```

Domain services are stateless. They operate on domain objects passed to them.

### Ubiquitous Language

Use the same terms in code, tests, and conversations with domain experts. If stakeholders
say "reservation", use `Reservation` in the code — not `Booking`, not `Slot`. If they say
"submit an order", the method is `order.submit()`, not `order.changeStatus("submitted")`.

This consistency makes code readable to domain experts and reduces translation errors.

---

## How Hexagonal and DDD Fit Together

| DDD concept                 | Hexagonal layer      | Example                        |
| --------------------------- | -------------------- | ------------------------------ |
| Value Object                | Domain               | `Email`, `Money`, `OrderId`    |
| Entity                      | Domain               | `User`, `Order`                |
| Aggregate root              | Domain               | `Order` (owns `OrderItem[]`)   |
| Domain Service              | Domain / Application | `TransferService`              |
| Repository (interface)      | Application / Domain | `OrderRepository`              |
| Use case                    | Application          | `SubmitOrder.execute(command)` |
| Repository (implementation) | Infrastructure       | `PostgresOrderRepository`      |
| HTTP controller             | Infrastructure       | `OrderHttpController`          |
| Message consumer            | Infrastructure       | `OrderEventConsumer`           |

The domain core is a pure TypeScript module with no framework imports — no Express, no
database drivers, no HTTP clients. Infrastructure wires everything together at startup.

---

## Anti-Patterns to Flag

- **Domain logic in adapters** — SQL queries containing business rules; HTTP controllers
  making business decisions. Push logic inward.
- **Infrastructure types in the domain** — `import pg from "pg"` in a domain entity.
  The domain must not know how it is persisted.
- **Anemic domain model** — entities with only getters/setters and all logic in service
  classes. Behaviour belongs on the entity or functions in the domain layer which operate on them.
- **Large aggregates** — an aggregate spanning many tables or containing collections that
  grow unboundedly. Split into smaller aggregates communicating via events.
- **Cross-aggregate transactions** — modifying two aggregates in one database transaction.
  Use domain events and eventual consistency instead.
- **Repositories returning raw rows** — the repository must reconstruct domain objects,
  not leak persistence types into the application layer.
