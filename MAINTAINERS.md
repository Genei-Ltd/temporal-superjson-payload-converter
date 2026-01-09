# Maintainer Guide

## Development workflow

1. Make your changes in `src/`
2. Add or update tests in `tests/`
3. Verify everything works:
   ```bash
   bun run tc      # Type check
   bun run lint    # Lint
   bun run test    # Run tests
   bun run build   # Build
   ```

## Publishing a new version

1. Ensure all checks pass (see above)
2. Update the version:
   ```bash
   npm version <patch|minor|major>
   ```
3. Push the version commit and tag:
   ```bash
   git push && git push --tags
   ```
4. Publish to npm:
   ```bash
   npm publish
   ```

## Version guidelines

- **patch**: Bug fixes, documentation updates
- **minor**: New features, non-breaking changes
- **major**: Breaking changes to the API (e.g., changing the payload format)
