# API Guide

Base path: `/api/v1`.

All JSON responses include `success`, `status`, `requestId` and `timestamp`.

## Generate

`POST /numbers/generate`

```json
{
  "network": "airtel",
  "quantity": 20,
  "format": "international",
  "mode": "random",
  "prefix": "068",
  "seed": "optional-seed",
  "save": true,
  "preventPreviouslyGenerated": false
}
```

For mixed generation, use network `mixed` plus `weights`:

```json
{
  "network": "mixed",
  "quantity": 100,
  "format": "local",
  "mode": "random",
  "weights": {
    "airtel": 30,
    "vodacom": 25,
    "yas": 25,
    "halotel": 15,
    "ttcl": 5
  }
}
```

## Detect

`POST /numbers/detect`

```json
{"phoneNumber":"+255689123456"}
```

The detected network represents the number-range allocation, not guaranteed current carrier.

## Analyze

`POST /numbers/analyze`

```json
{"numbers":["0689123456","0712345678","123"]}
```
