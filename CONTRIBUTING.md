# Contributing

Use focused changes, preserve the domain/service/controller boundaries, add tests for numbering-rule changes, and include a source when changing prefix allocations.

Before opening a pull request:

```bash
bun install
bun run typecheck
bun test
```

Do not add subscriber data, scraped personal phone-number lists or functionality intended to determine private subscriber identity.
