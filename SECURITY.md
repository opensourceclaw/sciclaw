# Security Policy

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 4.0.x   | :white_check_mark: |
| < 4.0   | :x:                |

Only the current major line (`4.0.x`) receives security fixes. SciClaw is
released from `main`; pre-4.0 releases are unsupported.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Use GitHub's private reporting channel for this repository:
**Security → Report a vulnerability**
(`https://github.com/opensourceclaw/sciclaw/security/advisories/new`).

If you cannot use that channel, contact the maintainer directly (Peter Cheng,
`liantian@users.noreply.github.com`) with:

- the affected version or commit,
- a description of the issue and its impact,
- reproduction steps or a proof of concept,
- any suggested fix or mitigation.

## What to expect

- **Acknowledgement** within 3 business days.
- **Assessment** (severity, affected versions, fix plan) within 10 business days.
- **Disclosure**: we coordinate the fix and the release, and credit reporters in
  the advisory unless they prefer to stay anonymous. Please allow a reasonable
  window for a fix to ship before public disclosure.

## Scope note

SciClaw runs local research pipelines and calls out to search providers and LLM
APIs. Credentials for those providers are held by the operator, not by the
project. Issues in third-party services should be reported to those services.
