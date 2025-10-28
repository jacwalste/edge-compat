# Contributing to edge-compat

Thank you for your interest in contributing to **edge-compat**! We welcome contributions from the community.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/edge-compat.git
   cd edge-compat
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Build all packages**:
   ```bash
   pnpm build
   ```
5. **Run tests**:
   ```bash
   pnpm test
   ```

## Development Workflow

### Project Structure

```
edge-compat/
├── packages/
│   ├── cli/           # CLI scanner
│   ├── rules/         # Rule engine and detectors
│   └── runtime/       # Runtime helpers
├── examples/          # Example projects for testing
└── website/          # Documentation site (VitePress)
```

### Making Changes

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the appropriate package

3. **Build and test**:
   ```bash
   pnpm build
   pnpm test
   pnpm typecheck
   ```

4. **Test with examples**:
   ```bash
   pnpm --filter edge-compat exec edge-compat scan examples/basic-ts
   ```

### Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or updates
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

**Example**:
```bash
git commit -m "feat: add rule for detecting long-running timers in edge middleware with configurable threshold and helpful suggestions"
```

**Important**: Commit messages should be at least 15 words to provide sufficient context.

### Adding a New Rule

1. Create a new file in `packages/rules/src/rules/your-rule.ts`:

```typescript
import type { Rule, RuleContext, RuleResult, Finding } from '../types.js';
import { RuleSeverity } from '../types.js';
import { generateCodeFrame } from '../utils/codeframe.js';

export const myNewRule: Rule = {
  id: 'category/rule-name',
  name: 'Human-readable name',
  description: 'What this rule checks for',
  category: 'node-core' | 'edge-pattern' | 'dependency' | 'bundle',
  severity: RuleSeverity.ERROR,
  enabled: true,

  detect(context: RuleContext): RuleResult {
    const findings: Finding[] = [];
    // Your detection logic here
    return { findings };
  },
};
```

2. Export and register in `packages/rules/src/index.ts`:

```typescript
export * from './rules/your-rule.js';
import { myNewRule } from './rules/your-rule.js';
registry.register(myNewRule);
```

3. Add tests in `packages/rules/src/rules/__tests__/your-rule.test.ts`

### Adding a Dependency Replacement

Edit `packages/rules/src/recipes/replacements.ts`:

```typescript
export const REPLACEMENTS: Record<string, Replacement> = {
  'your-package': {
    from: 'your-package',
    to: 'edge-safe-alternative',
    reason: 'Why it doesn\'t work in Edge',
    installCommand: 'npm install edge-safe-alternative',
    migrationNotes: 'How to migrate',
    docsUrl: 'https://...',
  },
  // ...
};
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm --filter @edge-compat/rules test
```

### E2E Testing

```bash
# Test scanner on examples
pnpm --filter edge-compat exec edge-compat scan examples/basic-ts
pnpm --filter edge-compat exec edge-compat scan examples/nextjs-edge
```

### Adding Tests

Create test files next to your source files with `.test.ts` or `.spec.ts` extension:

```typescript
import { describe, it, expect } from 'vitest';
import { myNewRule } from '../your-rule.js';

describe('myNewRule', () => {
  it('should detect the issue', () => {
    const result = myNewRule.detect({
      filePath: 'test.ts',
      fileContent: 'const bad = require("bad-module");',
      edgeTarget: 'auto',
      strict: false,
    });
    
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe('category/rule-name');
  });
});
```

## Documentation

- Update `README.md` if you add major features
- Add examples to the `examples/` directory
- Update or add guides in `website/docs/` (when available)

## Pull Request Process

1. **Update your fork**:
   ```bash
   git remote add upstream https://github.com/jacwalste/edge-compat.git
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request** on GitHub

4. **Describe your changes**:
   - What problem does it solve?
   - How did you test it?
   - Any breaking changes?

5. **Wait for review** - We'll review and provide feedback

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions small and focused

## Questions?

- Open an [issue](https://github.com/jacwalste/edge-compat/issues)
- Start a [discussion](https://github.com/jackwalste/edge-compat/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉

