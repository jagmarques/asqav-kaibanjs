# Changelog

All notable changes to `asqav-kaibanjs` are listed here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [SemVer](https://semver.org/) and track the `package.json` version.

## [Unreleased]

## [0.1.1] - 2026-05-18

### Changed
- Comment hygiene sweep across the integration source (#7).
- `package.json` author rolled to `Asqav`; `package-lock.json` checked in (#6).
- Visible preflight failure plus public email and positioning cleanup (#5).
- AI-navigation gold-standard comment sweep (#4).

### Documentation
- `alt="Asqav"` on the logo banner (#3).
- Replaced canonicalization jargon with a pointer to the [SDK fingerprint spec](https://github.com/jagmarques/asqav-sdk/blob/main/docs/fingerprint-spec.md) (#2).
- Documented SDK hash-only / full-payload data-handling modes (#1).

## [0.1.0] - Initial release

Initial KaibanJS integration that wraps the framework's lifecycle hooks with Asqav signing so every team / agent / task event becomes a verifiable receipt.
