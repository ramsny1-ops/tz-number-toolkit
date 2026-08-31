# TZ Number Toolkit

A full-stack Tanzania mobile-number toolkit built with Bun, TypeScript, Express, EJS, SQLite and Zod.

It generates **synthetic test numbers**, detects the **original prefix allocation**, validates and normalizes Tanzanian mobile numbers, saves generation history, analyzes bulk datasets, and exports CSV, JSON or TXT.

> Important: generated values are synthetic test data. A syntactically valid generated number can coincidentally match a real subscriber number. Do not treat generated numbers as known-unused numbers. Prefix detection identifies the original numbering allocation, not necessarily the subscriber's current carrier because Mobile Number Portability exists.

## Features

- EJS server-rendered dashboard with modern vanilla JavaScript enhancements
- Tanzania network selector: Airtel, Vodacom, Yas, Halotel and TTCL
- Telxer 064 retained in the numbering registry as non-operational metadata
- Legacy `Tigo` alias mapped to Yas for user familiarity
- Random, sequential and deterministic seeded generation
- Prefix-specific generation
- Mixed-network weighted generation through the API
- Local and international formatting
- Number detector, validator and normalizer
- Bulk analyzer
- SQLite generation history
- Duplicate prevention inside every batch
- Optional global duplicate prevention against saved numbers
- CSV, JSON and TXT exports
- Statistics dashboard
- REST API under `/api/v1`
- Zod request validation
- Helmet, CORS, compression, rate limiting and request IDs
- Bun built-in SQLite driver
- Unit tests for the numbering engine

## Current numbering registry

The project registry is based on the Tanzania numbering allocations discussed in the TCRA National Numbering and Signaling Point Codes Plan available in 2026.

| UI brand | Operator | Prefixes | Generation |
| --- | --- | --- | --- |
| Halotel | Viettel Tanzania PLC | 061, 062, 063 | Enabled |
| Telxer | Telxer Enterprise Limited | 064 | Disabled by default |
| Yas | Honora Tanzania PLC | 065, 067, 070, 071, 077 | Enabled |
| Airtel | Airtel Tanzania PLC | 066, 068, 069, 078 | Enabled |
| Vodacom | Vodacom Tanzania PLC | 072, 074, 075, 076, 079 | Enabled |
| TTCL | Tanzania Telecommunications Corporation | 073 | Enabled |

Always re-check official TCRA publications before using the registry for regulatory or production-critical decisions.

## Quick start

```bash
cp .env.example .env
bun install
bun run typecheck
bun test
bun run dev
```

Open:

```text
http://127.0.0.1:9367
```

## Useful commands

```bash
bun run dev
bun run start
bun run typecheck
bun test
bun run doctor
bun run db:reset
```

## REST examples

Generate 20 Airtel numbers:

```bash
curl -X POST http://127.0.0.1:9367/api/v1/numbers/generate \
  -H 'Content-Type: application/json' \
  -d '{"network":"airtel","quantity":20,"format":"international","mode":"random","save":true}'
```

Detect a number:

```bash
curl -X POST http://127.0.0.1:9367/api/v1/numbers/detect \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"0689123456"}'
```

Bulk analyze:

```bash
curl -X POST http://127.0.0.1:9367/api/v1/numbers/analyze \
  -H 'Content-Type: application/json' \
  -d '{"numbers":["0689123456","0712345678","123"]}'
```

## API routes

```text
GET    /api/v1/health
GET    /api/v1/networks
GET    /api/v1/networks/:slug
POST   /api/v1/numbers/generate
POST   /api/v1/numbers/detect
POST   /api/v1/numbers/validate
POST   /api/v1/numbers/normalize
POST   /api/v1/numbers/analyze
GET    /api/v1/generations
GET    /api/v1/generations/:id
DELETE /api/v1/generations/:id
GET    /api/v1/generations/:id/export/:format
GET    /api/v1/statistics
```

## Architecture

The numbering engine under `src/domain` does not depend on Express, EJS or SQLite. Controllers call services, services call the domain and repositories, and both EJS pages and JSON routes share those same services.

See [ARCHITECTURE.md](./ARCHITECTURE.md), [docs/API.md](./docs/API.md) and [docs/SOURCES.md](./docs/SOURCES.md).

## Safety and intended use

This project is designed for development, testing, QA, dataset generation, validation and educational telecom tooling. It does not query subscriber identity, live SIM status, ownership, location or current-portability databases.

## License

MIT.

## Interface design

The default interface is a server-rendered EJS dashboard with a black cyber-inspired glass system. It intentionally uses no gradients. Purple is reserved for interaction and focus states, green is reserved for small operational signals, and white carries the primary content hierarchy.

The dashboard includes a collapsible sidebar, SVG controls, animated status cues, modal-first number detection, network allocation, recent activity and history, plus a modal network picker in the generator. Full routes remain available for direct navigation and API-oriented workflows.
