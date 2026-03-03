# Testing Strategy

- The Detroit school of testing: "Don't test what you don't own." Focus on testing the code and logic that you are responsible for. Avoid writing tests that verify the behavior of external systems, libraries, or frameworks.
- Prefer social tests (e.g., contract tests, local integration tests) over solitary tests (e.g., unit tests) when testing interactions with external dependencies. This helps to ensure that your tests are more resilient to changes in the implementation of those dependencies and better reflect real-world behavior. Not every file needs unit tests, but every file should be tested in some way.
- Avoid over-reliance on End-to-End (E2E) testing, which can be brittle and slow. Instead, prioritize unit, contract and local integration tests to ensure that your code is correct and that it integrates properly with external dependencies.
- Use E2E testing sparingly, and only for critical user flows or integration points that cannot be adequately covered by unit, contract or local integration tests.
- Emphasize testing the "happy path" and critical edge cases, rather than striving for 100% code coverage. Focus on testing the most important and high-risk parts of your codebase.
- Test behavior, not implementation. Write tests that verify the expected behavior of your code, rather than testing specific implementation details that may change over time.
- Avoid mocking or stubbing internal implementation details of your own code. Instead, use real instances of your classes and modules in tests to ensure that you are testing the actual behavior of your code.
- Mock I/O in unit tests when necessary, to isolate your tests from external dependencies.
- For local integration tests mock sibling service using tools like wire mock. Spin up "owned" service like databases or event buses in dev containers to test integration with these dependencies.
- Construct your code in a way that makes it easy to test. This may involve using dependency injection, designing for testability, and following good software design principles to ensure that your code is modular and easy to test.
- Use dev containers for integration testing, to ensure adapters integrate correctly with external dependencies. Limit these tests to the happy path where possible.
