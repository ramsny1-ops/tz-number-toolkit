# Security Policy

## Reporting

Report vulnerabilities privately to the repository maintainers rather than publishing an exploit first.

## Design notes

The application validates JSON payloads with Zod, uses parameterized SQLite statements, applies rate limits, disables Express identification headers, applies Helmet, limits body sizes and prevents user-controlled export filesystem paths.

Generated data is synthetic and must not be represented as verified unused subscriber inventory.
