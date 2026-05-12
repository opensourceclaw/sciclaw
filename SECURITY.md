# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in neoclaw, please report it
via [GitHub Security Advisories](https://github.com/opensourceclaw/neoclaw/security/advisories/new).

**Do not file a public issue.**

We aim to acknowledge reports within 48 hours and provide a fix within
7 days for critical issues.

## Security Architecture

neoclaw provides built-in security features:

| Component | Protection |
|-----------|-----------|
| AICircuitBreaker | Execution limits (steps, API calls, tokens, time) |
| HumanInLoopApprovalGate | High-risk operation approval workflow |
| TaskScopedIdentityManager | Least-privilege access with TTL expiration |
| PrecommitQualityGates | Code quality + security scanning |
| DualAIAuditor | Builder + Adversary code audit |
| ArchitectureContractVerifier | Layer boundary enforcement |

See [docs/security/OWASP_ASI_SELF_ASSESSMENT.md](docs/security/OWASP_ASI_SELF_ASSESSMENT.md)
for our self-assessment against the OWASP Top 10 for Agentic Applications.

## Supported Versions

| Version | Status |
|---------|--------|
| v3.0.0 | ✅ Active |
| v2.x | ⚠️ Maintenance only |

## Dependencies

neoclaw has zero hard dependencies. Optional integrations:
- claw-mem (memory) — optional
- claw-rl (learning) — optional

LLM capabilities are delegated to the OpenClaw framework; neoclaw
does not manage API keys or model credentials directly.
