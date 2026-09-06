# Processor Risk Index

Independent research on payment-processor lockout risk: shutdowns, funds holds, reserves, support, and how hard it is to leave.

This is not a fee comparison. Higher scores mean more merchant-dependency exposure, not a prediction that anyone will get shut down.

[![Use EdgeOne Pages to deploy](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fa12987654321huytre-netizen%2Fprocessor-risk-index&project-name=processor-risk-index&install-command=npm%20install&build-command=npm%20run%20build%3Aedgeone&output-directory=dist)

## Stack

- TanStack Start + React 19 + Tailwind v4
- No accounts. Scores and sources ship with the app.

## Local

```bash
npm install
npm run dev
```

## EdgeOne Pages

Git-connected projects read `edgeone.json`. That file sets:

| Setting | Value |
| --- | --- |
| Install command | `npm install` |
| Build command | `npm run build:edgeone` |
| Output directory | `dist` |
| Node | 22.11.0 |

`npm run build` is the Vercel/SSR build on Grok. On EdgeOne Git CI it switches to the static SPA build. `build:edgeone` prerenders into `.output/public` and copies that to `dist/` so the Git builder always finds an `index.html`. `edgeone.json` also rewrites unmatched paths to `index.html`.
