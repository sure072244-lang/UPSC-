# PRECISION — UPSC CSE Prelims 2027 / StudyTracker-style Personal Study OS

## Release: V8.2-FINAL

Personal-use static PWA with a Cloudflare Pages + Workers + D1 backend path and a Vercel-compatible serverless fallback.

### What is preserved
- Existing research/data layers and archives are retained.
- 2014–2026 PYQ master: 1,300 records, 100 questions/year.
- 2014–2025 local question text/options layer is preserved; 2026 records retain the portal's source-of-record approach.
- 50 immutable mock slots with unique paper codes.
- OMR templates, evaluation data, source registries, research archives, training state, feature registries and downloadable research bundles remain in the package.
- No legacy data file is deleted by the V8.2 layer.

### V8.2 reliability fixes
- V8 now activates before legacy render, so the first paint does not trigger the old blocking `loadAll()` path.
- Search index remains lazy; the large search index is not parsed on first paint.
- Data hydration is non-blocking and failure-tolerant.
- Last-open view is restored from local persistence.
- Study timer measures only active study-session time, not page browsing time.
- Wall-clock timestamps recover elapsed study time after tab/app backgrounding.
- One study subject ledger runs at a time; changing subjects requires stopping/pausing the active session.
- 365-day local retention is enforced by the existing persistence layer.
- D-Day mocks obey the configured date and 09:30–11:30 IST access window; Dry-run/QA is separate.
- OMR flow is `Upload → Detect → Review → Key Vault Draft → Final Key → Official Key → Evaluate → Result`.
- Answer keys are bound to exact test number + paper code.
- Official answer keys are stored separately and can be selected explicitly as the evaluation source.
- Cross-portal key bridge is available through `/api/key` when Cloudflare D1 is bound.
- Mistral AI uses streaming through `/api/ai`; the browser stores conversation state, not the provider secret.
- Safe AI portal actions are limited to explicit allow-listed navigation/mutation commands.
- WebAuthn platform passkey support is origin-bound and requires HTTPS.
- Service-worker cache is versioned to `precision-upsc-v8-2`.
- Global AI FAB and compact timer shortcut are available across views.

### AI configuration
Use a secret named:

`MISTRAL_API_KEY`

The release is configured for the Mistral Small 4 family through `mistral-small-latest` and optional built-in web search through the Conversations API.

**Do not embed API keys in HTML/JS.** Any secret pasted into chat, source control, or a public ZIP should be rotated/revoked.

### Recommended deployment

**Primary:** Cloudflare Pages + `_worker.js` + D1.

This gives a real backend path for AI, durable cloud sync and the cross-portal answer-key bridge. Static assets remain CDN-delivered. A D1 database is required for durable online persistence; local persistence remains the fallback when D1 is unavailable.

**Fallback:** Vercel + `api/ai.js` + `api/sync.js`.

The Vercel sync file is a compatibility fallback and is not intended to replace a durable database.

### QA
Run:

```bash
python tests/phase_h_static_qa.py
node tests/v8_functional_smoke.js
node tests/phase_h_behavioral_qa.js
```

The QA suite validates file integrity, JavaScript syntax, feature/data counts, PYQ years, mock architecture, Study Timer arithmetic, D-Day gates, answer-key validation/scoring, OMR geometry, backend routes, WebAuthn markers and secret-leak prevention.

### Important browser limitations
- WebAuthn passkeys are tied to the production hostname. Register again when the hostname changes.
- A service worker may be unable to install until the site is first opened over HTTPS.
- Browsers may throttle JavaScript redraw while a page is backgrounded; the study timer recovers elapsed wall-clock time when the page resumes.
- Live Mistral AI requires a valid `MISTRAL_API_KEY` in the deployed backend environment and working network access.


## V8.3 reliability note
This release keeps the V8.2 feature set and adds deterministic boot, cache migration, service-worker hardening and a Mistral Small 4 fallback path.
