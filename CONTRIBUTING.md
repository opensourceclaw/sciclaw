# Contributing to DeepClaw

Thank you for your interest in contributing to DeepClaw! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** 2.0.0 or higher

### Getting Started

```bash
# Clone the repository
git clone https://github.com/peterchengorg/deepclaw.git
cd deepclaw

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
deepclaw/
├── src/                 # Source code
│   ├── agents/          # Multi-agent system
│   ├── approval/        # Human-in-the-Loop (v3.5.0)
│   ├── cache/           # Distributed caching
│   ├── cli/             # Pipeline CLI (v3.5.0)
│   ├── gate/            # Gate enforcement (v3.5.0)
│   ├── knowledge/       # Knowledge graph
│   ├── llm/             # LLM providers
│   ├── monitoring/      # Observer (v3.5.0)
│   ├── orchestrator/    # Research orchestration
│   ├── research/        # Research pipeline
│   ├── search/          # Multi-engine search
│   ├── synthesis/       # Cross-domain synthesis
│   ├── trigger/         # Trigger manager (v3.5.0)
│   └── validation/      # Fact-checking
├── tests/               # Test files
├── docs/                # Documentation
└── dist/                # Compiled output
```

## Code Style

### TypeScript

- **Strict mode** is enabled. All code must pass strict type checking.
- No `any` types. Use `unknown` and narrow with type guards.
- Use **Zod** for runtime validation of external inputs.
- Prefer `interface` for object types, `type` for unions/intersections.

### Naming Conventions

- **Files**: `snake_case.ts` for source files
- **Classes**: `PascalCase`
- **Functions/variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/interfaces**: `PascalCase`

### English Only

All source code, comments, and documentation must be in **English only**.

```bash
# Check for Chinese characters
./scripts/check-chinese.sh
```

### License Headers

All source files must include the Apache 2.0 license header:

```typescript
/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Copyright 2026 Peter Cheng
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `test:` — Adding/updating tests
- `refactor:` — Code refactoring
- `chore:` — Maintenance tasks

Examples:
```
feat: add InternalVerifyGate with 9 validation rules
fix: resolve type error in AlertManager
docs: update README with v3.5.0 features
test: add 14 tests for TriggerManager
```

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feat/your-feature`
3. **Make changes** following code style guidelines
4. **Run tests**: `npm test` — all tests must pass
5. **Check for Chinese**: `./scripts/check-chinese.sh` — must show 0 files
6. **Commit** with conventional commit message
7. **Push** to your fork
8. **Open a Pull Request** against `main`

### PR Checklist

- [ ] Code compiles (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] No Chinese characters in source
- [ ] License headers present
- [ ] Conventional commit messages
- [ ] Documentation updated (if applicable)

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx vitest run tests/path/to/test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Guidelines

- Use **vitest** framework
- Aim for **80%+ code coverage**
- Test both success and failure cases
- Use descriptive test names
- Keep tests focused and isolated

### Test Structure

```typescript
describe("ModuleName", () => {
  describe("methodName", () => {
    it("should do something when condition", () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Architecture

See [Architecture Documentation](docs/architecture/README.md) for details.

Key patterns:
- **Agent Pattern**: `BaseAgent`, `Orchestrator`
- **Gate Pattern**: `InternalVerifyGate`, `ApprovalGate`
- **Observer Pattern**: `DeepClawObserver`
- **Registry Pattern**: `LLMProviderRegistry`, `GateRegistry`

## License

DeepClaw is licensed under the **Apache License 2.0**. By contributing, you agree that your contributions will be licensed under the same license.

---

*Thank you for contributing to DeepClaw!*
