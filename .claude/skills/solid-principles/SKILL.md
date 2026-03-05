---
name: solid-principles
description: >
  SOLID design principles for writing maintainable, extensible, testable code. Load this
  skill whenever designing new modules or classes, reviewing code structure, or refactoring
  — SOLID violations are a common root cause of hard-to-test and hard-to-change code.
  Covers SRP, OCP, LSP, ISP, and DIP with TypeScript examples and anti-patterns to flag.
---

# SOLID Design Principles

SOLID is a set of five design principles that guide the structure of object-oriented code.
They reduce coupling, increase cohesion, and make code easier to test and extend. Violations
often explain why a codebase becomes hard to change or test over time.

## Single Responsibility Principle (SRP)

**Each module, class, or function should have responsibility over a single part of the
functionality.** A class has one reason to change.

A class that validates input, persists to the database, and sends emails has three reasons to
change. Split it.

```typescript
// Bad: one class owns validation, persistence, and notifications
class UserService {
  async register(email: string, password: string) {
    if (!/^[^@]+@[^@]+$/.test(email)) throw new Error("invalid email")
    const hash = await bcrypt.hash(password, 10)
    await this.db.query("INSERT INTO users ...", [email, hash])
    await this.mailer.send({ to: email, subject: "Welcome" })
  }
}

// Good: each collaborator owns one concern
class UserRegistrar {
  constructor(
    private readonly validator: EmailValidator,
    private readonly hasher: PasswordHasher,
    private readonly repo: UserRepository,
    private readonly mailer: WelcomeMailer,
  ) {}

  async register(email: string, password: string): Promise<User> {
    this.validator.validate(email)
    const hash = await this.hasher.hash(password)
    const user = await this.repo.save(new User(email, hash))
    await this.mailer.sendWelcome(user)
    return user
  }
}
```

SRP is the most frequently violated principle. A tell-tale sign: the class has more than one
logical group of methods, or its test file requires mocking unrelated dependencies.

## Open/Closed Principle (OCP)

**Software entities should be open for extension, but closed for modification.** Adding new
behaviour should not require changing existing code.

The typical mechanism is polymorphism — a common interface with multiple implementations —
or the strategy pattern.

```typescript
// Bad: adding a new discount type requires editing this function
function calculateDiscount(order: Order, type: string): number {
  if (type === "student") return order.total * 0.1
  if (type === "senior") return order.total * 0.15
  return 0
}

// Good: extend by adding a new strategy, no existing code changes
interface DiscountStrategy {
  apply(order: Order): number
}

class StudentDiscount implements DiscountStrategy {
  apply(order: Order) { return order.total * 0.1 }
}

class SeniorDiscount implements DiscountStrategy {
  apply(order: Order) { return order.total * 0.15 }
}

class PricingEngine {
  constructor(private readonly discounts: DiscountStrategy[]) {}
  total(order: Order): number {
    return order.total - this.discounts.reduce((sum, d) => sum + d.apply(order), 0)
  }
}
```

OCP does not mean never modifying code. It means that stable, frequently-extended paths
should be structured so new cases don't require touching existing logic.

## Liskov Substitution Principle (LSP)

**Objects of a subclass should be replaceable with objects of the superclass without
affecting the correctness of the program.** A subtype must honour the contract of its
supertype — not just the method signatures, but the behavioural expectations.

```typescript
// Bad: Square is not a valid substitute for Rectangle
// — callers that set width and height independently will get wrong area
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  setWidth(w: number)  { this.width = w }
  setHeight(h: number) { this.height = h }
  area() { return this.width * this.height }
}

class Square extends Rectangle {
  setWidth(w: number)  { this.width = w; this.height = w }  // Breaks LSP
  setHeight(h: number) { this.width = h; this.height = h }
}

// Good: model as independent types sharing an interface
interface Shape { area(): number }
class Rectangle implements Shape { ... }
class Square implements Shape { ... }
```

An LSP violation often manifests as an `instanceof` check or a special-case `if` branch in
code that should be polymorphic. These are flags to redesign the type hierarchy.

## Interface Segregation Principle (ISP)

**Many client-specific interfaces are better than one general-purpose interface.** Clients
should not be forced to depend on methods they do not use.

```typescript
// Bad: every consumer must depend on the full interface,
// even if they only read or only write
interface UserRepository {
  findById(id: string): Promise<User>
  findAll(): Promise<User[]>
  save(user: User): Promise<void>
  delete(id: string): Promise<void>
  generateAuditReport(): Promise<Report>  // only used by admin jobs
}

// Good: split by client need
interface UserReader {
  findById(id: string): Promise<User>
  findAll(): Promise<User[]>
}

interface UserWriter {
  save(user: User): Promise<void>
  delete(id: string): Promise<void>
}

interface UserAuditor {
  generateAuditReport(): Promise<Report>
}

// The concrete repository implements all three
class PostgresUserRepository implements UserReader, UserWriter, UserAuditor { ... }
```

Fat interfaces create unnecessary coupling. A service that only reads users shouldn't need
to change when a write method signature changes.

## Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions. High-level modules should not depend on
low-level modules. Both should depend on abstractions.**

Define interfaces in the layer that needs them; implement those interfaces in the layer that
provides them. The high-level module controls the contract.

```typescript
// Bad: high-level service directly instantiates a low-level module
class OrderService {
  private readonly repo = new PostgresOrderRepository()  // hard dependency

  async submit(orderId: string) {
    const order = await this.repo.findById(orderId)
    order.submit()
    await this.repo.save(order)
  }
}

// Good: depend on the abstraction; inject the concrete at the composition root
interface OrderRepository {
  findById(id: string): Promise<Order>
  save(order: Order): Promise<void>
}

class OrderService {
  constructor(private readonly repo: OrderRepository) {}  // abstraction injected

  async submit(orderId: string) {
    const order = await this.repo.findById(orderId)
    order.submit()
    await this.repo.save(order)
  }
}
```

DIP is what makes unit testing without integration infrastructure practical. When the
`OrderService` test injects an in-memory `OrderRepository`, no database is needed.

## Connection to Testability

SOLID principles and testability reinforce each other:

- **SRP** keeps classes small, making test setup straightforward.
- **OCP** means behaviour can be varied in tests by swapping strategies.
- **LSP** ensures test doubles can substitute real collaborators without surprising behaviour.
- **ISP** means test doubles only need to implement the methods the code under test actually calls.
- **DIP** enables injecting in-process substitutes (fakes, in-memory implementations) at
  test time without changing production code.

If a class is difficult to test in isolation, it is likely violating one or more of these
principles.

## Anti-Patterns to Flag

- **God class** — one class doing everything (SRP)
- **Switch/if-chain on type** — a stable extension point not using polymorphism (OCP)
- **Overriding methods to throw `NotImplementedError`** — subtype breaks parent contract (LSP)
- **Forcing consumers to implement irrelevant interface methods** (ISP)
- **`new ConcreteClass()` inside a service constructor** — hard dependency (DIP)
- **Static singletons used as dependencies** — untestable, hidden coupling (DIP)
