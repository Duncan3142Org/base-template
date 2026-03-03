# Software Architecture

## Solid Design Principles

- Single Responsibility Principle: Each module, class or function should have responsibility over a single part of the functionality provided by the software.
- Open/Closed Principle: Software entities should be open for extension, but closed for modification.
- Liskov Substitution Principle: Objects of a superclass should be replaceable with objects of a subclass without affecting the correctness of the program.
- Interface Segregation Principle: Many client-specific interfaces are better than one general-purpose interface.
- Dependency Inversion Principle: Depend on abstractions,not on concretions. High-level modules should not depend on low-level modules. Both should depend on abstractions.

## Hexagonal Architecture

- Hexagonal Architecture (also known as Ports and Adapters) is a software design pattern that promotes separation of concerns and testability by isolating the core business logic from external dependencies.
- The core business logic is represented as a hexagon, with ports (interfaces) on the sides that allow communication with the outside world through adapters.
- This architecture allows for flexibility in changing external dependencies (e.g., databases, APIs) without affecting the core logic, and facilitates testing by allowing for easy mocking of external interactions.

## Domain Driven Design (DDD)

- DDD is an approach to software development that emphasizes understanding the business domain and modeling it in code. It promotes a clear separation of concerns and encourages collaboration between technical and domain experts.
- Key concepts in DDD include:
  - Entities: Objects that have a distinct identity and lifecycle.
  - Value Objects: Objects that represent a concept or measurement and do not have a distinct identity.
  - Aggregates: A cluster of related entities and value objects that are treated as a single unit for data changes.
  - Repositories: Abstractions that provide methods for retrieving and storing aggregates.
  - Services: Operations that do not naturally fit within an entity or value object, often representing domain logic that involves multiple entities or value objects.
- DDD encourages the use of a ubiquitous language, where the same terms and concepts are used consistently across the codebase and in communication between technical and domain experts. This helps to ensure that the software accurately reflects the business domain and can evolve as the domain changes.
