# PRECISION V8.2 — Deployment Guide

## Recommended: Cloudflare Pages + Advanced Mode Worker + D1

This release is designed to use Cloudflare as the primary backend because it supports the bundled `_worker.js` routes for AI, cloud sync and the answer-key bridge, while Pages serves the static portal.

### 1. Deploy the ZIP
Upload this package to a Cloudflare Pages project using the dashboard/Direct Upload workflow, or deploy the directory with Wrangler.

### 2. Configure the AI secret
Add a **Secret** named:

`MISTRAL_API_KEY`

Never place the secret inside `index.html`, `app.js`, `v8-enhancements.js`, or any public JSON/CSV file.

### 3. Create and bind D1
Create a D1 database and run:

`cloudflare/schema.sql`

Bind it to the Worker using the variable name:

`DB`

Replace the placeholder `database_id` in `wrangler.toml` before CLI deployment.

### 4. Health check
After deployment, open:

`/api/health`

The response reports whether the AI secret and D1 binding are available.

### 5. Vercel fallback
Vercel can host the same static bundle and `api/ai.js`. Add `MISTRAL_API_KEY` as a sensitive environment variable in the project settings. The bundled `api/sync.js` is a compatibility fallback; use a real managed database for durable online sync.

## Current platform notes
- Cloudflare Pages static asset requests are free/unlimited; Functions use Workers quotas.
- Workers Free currently provides 100,000 requests/day.
- D1 Free currently provides 5M rows read/day, 100k rows written/day and 5 GB storage; daily read/write limits are enforced.

## Passkey
WebAuthn is origin-bound. The passkey should be registered after the final production hostname is selected. Moving from a Vercel hostname to a Cloudflare hostname requires a new platform passkey registration.

## AI
The browser talks to `/api/ai`; the backend talks to Mistral. The UI supports streamed responses and stores AI history locally/cloud-sync state. The package intentionally does not contain a provider secret.


## V8.3
Use the Vercel API endpoint `/api/ai` with server-side `MISTRAL_API_KEY` and optional `MISTRAL_MODEL=mistral-small-2603`. `/api/health` reports configuration.
