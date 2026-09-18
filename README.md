# Processor Risk Index

Independent research on payment-processor lockout risk: shutdowns, funds holds, reserves, support, and how hard it is to leave.

This is not a fee comparison. Higher scores mean more merchant-dependency exposure, not a prediction that anyone will get shut down.

## Stack

- TanStack Start + React 19 + Tailwind v4
- No accounts. Scores and sources ship with the app.

## Local

```bash
npm install
npm run dev
```

## Deploy on Cloudflare

Git import in the dashboard. A default Worker import uses `npm run build` then `npx wrangler deploy` — that is the path this repo is set up for.

### Workers (dashboard default)

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Node | 22 (from `.nvmrc`) |

`npm run build` sees `WORKERS_CI=1` and writes a static SPA to `dist/`. `wrangler.toml` publishes that folder as assets, with SPA fallback for `/processor/paypal` and `/rankings`.

### Pages (classic)

In [Workers & Pages → Create → Pages → Connect to Git](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github), import the same repo.

| Setting | Value |
| --- | --- |
| Framework preset | Vite (or None) |
| Build command | `npm run build:pages` |
| Build output directory | `dist` |
| Root directory | `/` |
| Environment variable | `NODE_VERSION` = `22` |

After the first deploy, every push to `main` republishes.

## EdgeOne Pages (optional)

EdgeOne's Git image is Node 22.11. Vite 8's Rolldown binary asks for 22.12, so a plain `npm install` skips the native binding. Prefer Cloudflare unless you already have an EdgeOne project.

| Setting | Value |
| --- | --- |
| Install command | `npm install --no-engine-strict --include=optional --include=dev` |
| Build command | `npm run build:edgeone` |
| Output directory | `dist` |
| Node | 22.11.0 |
