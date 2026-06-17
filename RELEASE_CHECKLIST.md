# Release Preflight Checklist

Use this checklist before creating any release to ensure all version-related items are updated.

## Pre-Release Checklist

- [ ] `package.json` version has been bumped
- [ ] `openclaw.plugin.json` version has been bumped (if exists)
- [ ] `README.md` version badge updated
- [ ] CHANGELOG new entry added with date
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (run 3 times for stability)
- [ ] All changes committed to git
- [ ] Git tag created with correct version

## Version Bump Commands

```bash
# 1. Update version in package.json
npm version patch  # or minor/major

# 2. Update openclaw.plugin.json (if exists)
sed -i '' 's/"version": "X.Y.Z"/"version": "NEW_VERSION"/' openclaw.plugin.json

# 3. Update README.md
sed -i '' 's/vX.Y.Z/vNEW_VERSION/g' README.md

# 4. Add CHANGELOG entry
# See CHANGELOG.md for format

# 5. Commit
git add -A
git commit -m "chore: bump version to vNEW_VERSION"

# 6. Create tag
git tag vNEW_VERSION

# 7. Push
git push origin main --tags
```

## Post-Release

- [ ] GitHub Release created
- [ ] npm publish (if applicable)
