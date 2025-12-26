# @prosdevlab/experience-sdk

## 0.1.1

### Patch Changes

- fdad132: Fix npm install error from v0.1.0. Add README and improve workflows.

  v0.1.0 was published with `workspace:*` dependency which doesn't work outside the monorepo. This release fixes that by letting changesets automatically convert it to the proper version range during publish.

  - Add: README with installation instructions and examples
  - Add: READMEs for plugins package
  - Fix: pnpm version conflicts in GitHub workflows
  - Add: Release banner to docs homepage
