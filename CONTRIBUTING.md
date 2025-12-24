# Contributing to Experience SDK

Thank you for considering contributing to Experience SDK! This document outlines the process for contributing and the standards we follow.

## Development Process

1. **Fork and clone** the repository
2. **Install dependencies**: `pnpm install`
3. **Create a branch**: `git checkout -b feature/my-feature`
4. **Make your changes**
5. **Test your changes**: `pnpm test`
6. **Ensure code quality**: `pnpm lint && pnpm typecheck`

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This is enforced using commitlint.

Format: `type(scope): subject`

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to build process or auxiliary tools

Examples:
```
feat(core): add explainability trace to decisions
fix(plugins): correct frequency capping logic
docs: update API examples in README
```

## Pull Request Process

1. Update the README.md if needed with details of changes to the interface.
2. Add a changeset to document your changes: `pnpm changeset`
3. Create a pull request to the `main` branch.
4. The PR will be reviewed and merged if it meets our standards.

## Project Structure

```
experience-sdk/
├── packages/
│   ├── core/          # Main runtime (@prosdevlab/experience-sdk)
│   └── plugins/       # Official plugins (@prosdevlab/experience-sdk-plugins)
├── demo/              # Demo site
└── notes/             # Planning & architecture docs
```

## Adding New Packages

1. Create a new directory in the `packages` folder.
2. Create a `package.json`, `tsconfig.json`, and `tsup.config.ts`.
3. Add the package to relevant workspace configurations.
4. Update dependencies if needed.

## Adding New Plugins

Plugins should follow the sdk-kit plugin pattern:

```typescript
import type { PluginFunction } from '@lytics/sdk-kit';

export const myPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('my-plugin');
  
  plugin.defaults({
    myPlugin: {
      enabled: true,
      // ... config
    }
  });
  
  plugin.expose({
    myPlugin: {
      // ... public API
    }
  });
  
  instance.on('sdk:ready', () => {
    // Initialize
  });
};
```

See `notes/IMPLEMENTATION_PLAN.md` for detailed plugin patterns.

## Testing

- Write tests for all new features and bug fixes.
- Run existing tests to ensure your changes don't break existing functionality.
- Aim for 80%+ test coverage.
- Use Vitest for all tests.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## Code Style

We use Biome for linting and formatting:

```bash
# Check code quality
pnpm lint

# Format code
pnpm format
```

All code must pass linting and typechecking before being merged.

## Versioning

We use [Changesets](https://github.com/changesets/changesets) to manage versions and generate changelogs.

After making changes:
1. Run `pnpm changeset`
2. Follow the prompts to describe your changes
3. Commit the generated changeset file

## Questions?

If you have any questions, please open an issue or discussion in the repository.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
