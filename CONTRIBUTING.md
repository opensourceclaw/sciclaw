# Contributing to neoclaw

Thank you for contributing! neoclaw is a governance layer for AI agents — built-in six-layer cognitive governance, dual AI auditing, and task-scoped identity.

## Development Setup

```bash
git clone https://github.com/opensourceclaw/neoclaw.git
cd neoclaw
pip install -e ".[dev]"
```

## Running Tests

```bash
pytest                          # All tests
pytest tests/governance/ -v     # Governance tests
pytest --cov=neoclaw            # With coverage
```

## Code Style

- Python 3.8+ compatible (use `Optional[X]`, not `X | None`)
- Follow PEP 8
- Run `black .` before committing
- Type hints required for public APIs

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Add tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## Architecture

neoclaw follows a two-tier architecture:
- **Tier 1**: Built-in engines (always available, zero deps)
- **Tier 2**: Optional bridges (lazy-import, graceful fallback)

All LLM capabilities are delegated to the OpenClaw framework via OpenClawSession.

## Communication

Development coordination happens through the OpenClaw communication system:
- Tasks received via `~/.openclaw/workspace/comm/inbox-jarvis/`
- Responses sent via `~/.openclaw/workspace/comm/inbox-friday/`

## License

Apache License 2.0. All contributions are under this license.
