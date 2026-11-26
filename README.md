# PlayBeat Digital — Admin Panel

Operations console for the PlayBeat Digital commerce platform (playbeat.digital and the domain family).

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**, based on the free
[Tailwind-Admin](https://github.com/Tailwind-Admin/free-tailwind-admin-dashboard-template) Next.js dashboard template,
adapted for PlayBeat operations.

## Modules

| Route | Module | What it does |
| --- | --- | --- |
| `/login` | Login | Admin sign-in against the PlayBeat Worker `POST /api/admin/login` (Bearer session) |
| `/` | Dashboard | KPI cards, yearly breakup, monthly earning, sales overview, product performance, recent transactions |
| `/analytics` | Analytics | Traffic and revenue analytics views |
| `/orders` | Orders | Order list with status filters and manual-order workflows |
| `/catalog` | Catalog | Product catalog browsing and sync status |
| `/inquiries` | Inquiries | Customer inquiries / leads inbox |
| `/integrations` | Integrations | Catalog sync, Meta app tokens, Google Shopping feed controls |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Production build

The app is configured as a **static export** (`next.config.mjs`: `output: 'export'`, `trailingSlash: true`):

```bash
npm run build      # emits static site into ./out
npm run start      # serve the built app (used by the Dockerfile on port 3001)
```

Deployment options included in the repo:

- `dockerfile` — Node 20 Alpine production image, listens on port `3001`
- `netlify.toml` — SPA fallback redirect

API calls use relative `/api/*` paths; in production the static bundle is served behind the
PlayBeat Cloudflare Worker which implements `/api/admin/*` (login, stats, orders, catalog, inquiries).

## Repository

- Owner: `uzzirulzz-cyber`
- Upstream template: Tailwind-Admin free Next.js dashboard template (MIT-style permissive template license)
