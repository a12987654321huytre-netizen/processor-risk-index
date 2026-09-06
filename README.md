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

## Deploy on Cloudflare Pages

This is the Git deploy path. In [Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github), import `a12987654321huytre-netizen/processor-risk-index`.

| Setting | Value |
| --- | --- |
| Framework preset | Vite (or None) |
| Build command | `npm run build:pages` |
| Build output directory | `dist` |
| Root directory | `/` (leave default) |
| Environment variable | `NODE_VERSION` = `22` |

Node 22 on Cloudflare is current enough for Vite 8. `build:pages` prerenders the site into `dist/` and writes a `_redirects` SPA fallback so `/processor/paypal` and `/rankings` resolve.

After the first deploy, every push to `main` republishes.

## EdgeOne Pages (optional)

EdgeOne's Git image is Node 22.11. Vite 8's Rolldown binary asks for 22.12, so a plain `npm install` skips the native binding. Prefer Cloudflare unless you already have an EdgeOne project.

| Setting | Value |
| --- | --- |
| Install command | `npm install --no-engine-strict --include=optional --include=dev` |
| Build command | `npm run build:edgeone` |
| Output directory | `dist` |
| Node | 22.11.0 |
