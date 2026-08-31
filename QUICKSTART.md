# Quick Start

```bash
unzip tz-number-toolkit.zip
cd tz-number-toolkit
cp .env.example .env
bun install
bun run typecheck
bun test
bun run dev
```

Open `http://127.0.0.1:9367`.

If port 9367 is already in use, edit `.env` and change `PORT`.

Run the environment check with:

```bash
bun run doctor
```
