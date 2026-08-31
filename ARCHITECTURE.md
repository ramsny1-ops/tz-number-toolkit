# Architecture

## Goals

1. Keep Tanzania numbering rules independent of the web framework.
2. Use one source of truth for generation, detection and validation.
3. Keep EJS as a presentation layer rather than a business-logic layer.
4. Expose the same capabilities through a versioned REST API.
5. Persist only normalized data and derive presentation formats when needed.

## Request flow

```text
Browser or API client
        |
        v
Express routes
        |
        v
Controllers
        |
        v
Services
   |          |
   v          v
Domain      Repositories
Engine         |
               v
             SQLite
```

## Domain

`src/domain/networks.ts` contains the registry and aliases.

`src/domain/phone.ts` contains parsing, normalization, validation and allocation detection.

`src/domain/generator.ts` contains random, sequential and seeded generation.

These modules have no Express or database imports.

## Persistence

SQLite uses WAL mode and foreign keys. Generated numbers are stored in normalized E.164-like form without spaces, for example `+255681234567`.

A unique `(batch_id, normalized_number)` index prevents accidental duplicates inside a batch. Global duplicate prevention is handled through a repository lookup when requested.
