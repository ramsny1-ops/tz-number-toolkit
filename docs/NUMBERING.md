# Tanzania Numbering Registry

The project models mobile numbers as a 10-digit local form beginning with `0`, or a `+255` international form where the local trunk `0` is removed.

Examples:

```text
0689123456
+255689123456
255689123456
689123456
```

All normalize internally to:

```text
+255689123456
```

## Mobile Number Portability

Prefix allocation is not equivalent to guaranteed current carrier. The detector therefore exposes `allocationNetwork` and an explicit portability notice rather than pretending it knows a live subscriber's current network.
