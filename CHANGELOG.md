# Changelog

Notable changes to asqav-kaibanjs. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1]

First release.

### Added
- `AsqavClient`, `createAsqavMiddleware`, and `subscribeToTeam`: a
  Zustand-compatible KaibanJS middleware that signs task status transitions to
  the Asqav API on each store mutation. Signing is fail-open. It calls the Asqav
  REST API directly, so it does not depend on `@asqav/sdk`.
- Tag-gated npm publish workflow with provenance through GitHub OIDC.
- Pull-request CI that installs dependencies and runs `npm publish --dry-run`.
