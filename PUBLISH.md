# Publishing edge-compat to npm

## Prerequisites

1. **Login to npm:**
   ```bash
   npm login
   ```

2. **Verify you're logged in:**
   ```bash
   npm whoami
   ```

## Publishing Steps

### 1. Build all packages
```bash
cd /Users/jackstepanek/dev/edge-compat
pnpm build
```

### 2. Publish CLI package (main entry point)
```bash
cd packages/cli
npm publish --access public
```

### 3. Publish other packages (optional, can publish separately later)
```bash
cd ../rules
npm publish --access public

cd ../runtime  
npm publish --access public
```

## Alternative: Publish from root

You can also publish from the monorepo root using pnpm:

```bash
cd /Users/jackstepanek/dev/edge-compat
pnpm -w publish
```

But this will publish all packages. The recommended approach is to publish each package individually.

## After Publishing

1. **Test the published package:**
   ```bash
   npx edge-compat@latest --version
   ```

2. **Create a GitHub release:**
   - Go to https://github.com/jacwalste/edge-compat/releases
   - Click "Create a new release"
   - Tag: `v0.1.0`
   - Title: `v0.1.0 - Initial Release`
   - Description: `First release of edge-compat scanner`

3. **Update README badges:**
   The npm badge will update automatically once published

## Version Management

- Use `npm version patch|minor|major` to bump versions
- Or use Changesets (already configured):
  ```bash
  pnpm changeset
  pnpm changeset version
  ```

## Unpublishing (if needed)

You have 72 hours after publishing to unpublish:
```bash
npm unpublish edge-compat@0.1.0
```

