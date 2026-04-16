# Shine Cloud

Private cloud backend for Shine. Provides:

- **Auth** — presenter accounts (signup, login, JWT sessions)
- **Deck storage** — publish decks to Vercel Blob, manage via API
- **Sharing** — password-protected viewer links with time-limited tokens
- **Dashboard** — deck management UI (shared from `../template/src/`)

## Setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, BLOB_READ_WRITE_TOKEN, JWT_SECRET
npm run db:push               # create tables
npm run dev                   # start local dev
```

## Architecture

The cloud app reuses the full frontend from `../template/src/` via Vite's root config. The API lives in `./api/` as Vercel Functions.

Shared types come from `@shine/types` (`../packages/types/`).

## Deployment

Deploy as a Vercel project with root directory set to `cloud/`.

Required env vars:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob access token  
- `JWT_SECRET` — signing key for auth tokens
