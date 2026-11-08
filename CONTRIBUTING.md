# Contributing to Node Request Context

Thank you for your interest in contributing to `@ahmedyassin/node-request-context`!

## Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/ahmedibrahimyassindev/Node-Request-Context.git
   cd Node-Request-Context
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the TypeScript source:**
   ```bash
   npm run build
   ```

4. **Run the test suite:**
   ```bash
   npm test
   ```

## Guidelines

- Keep runtime dependencies to an absolute minimum (the core library uses native Node.js APIs).
- Maintain 100% TypeScript type safety.
- Write tests in the `tests/` directory for any new features or bug fixes.
- Ensure all tests pass before submitting a pull request.

## Submitting Pull Requests

1. Create a feature branch: `git checkout -b feature/my-feature`.
2. Commit your changes: `git commit -m "Add my feature"`.
3. Push to your branch: `git push origin feature/my-feature`.
4. Open a Pull Request on GitHub with a clear description of the change.
