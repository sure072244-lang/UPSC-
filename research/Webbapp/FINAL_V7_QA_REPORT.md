# PRECISION UPSC GS-I Portal — FINAL V7 QA REPORT

## Scope
This release is the continuation of the V6 repair where the application booted into a blank shell because required functions were missing and event binding failed before the UI became interactive.

## Automated smoke QA
Latest harness results:
- Navigation / sidebar: PASS — 21 primary navigation targets exercised
- Study timer: PASS — start, subject selection, preset, navigation-away pause, return resume, finish/save
- PYQ: PASS — 1,300 local records detected; 2019 filter returns records; question detail renders text/options for locally complete records
- PYQ 2026: PASS — records exist and official UPSC source-link path is available; local bundle does not reproduce full 2026 paper text
- OMR: PASS — two-page synthetic OMR flow detected 50 + 50 answers; draft reaches 100/100; final-key UI unlock path passes
- Answer-key vault: PASS — exact 100 valid answers gate final evaluation; saved vault exists for later access/export
- AI local command: PASS
- AI connection UI: PASS under mocked Gemini endpoint
- AI streaming parser: PASS under mocked Gemini endpoint
- Admin / device-lock controls: PASS — controls and lock-now path present; platform passkey prompt cannot be physically exercised in headless automation
- Page errors: 0 in latest harness run
- Console errors: 0 in latest harness run

## Release changes
- Repaired missing interaction bootstrap and runtime helpers.
- Added safe storage wrapper so browser storage failure does not prevent rendering.
- Added StudyTracker-style light glass/liquid dashboard.
- Added 23 UPSC Prelims/Mains/CSAT/Philosophy subject timers with separate cumulative ledgers.
- Added daily goals, per-subject goals, presets, focus mode, autosave, visibility/navigation pause-resume, session journal, streaks, 14-day analytics, CSV/data backup, and retention controls.
- Added subject/topic keyword colour coding.
- Added OMR quality scoring, rotation, strict re-run, ambiguity handling, audit export, automatic Key Vault draft population, final-key gating, and result snapshot preservation.
- Added WebAuthn platform passkey/device-lock path with graceful error handling.
- Reworked AI command handling so research prompts containing words such as PYQ/OMR do not get misinterpreted as navigation commands.
- AI response history survives re-render.
- Added 140+ AI capability registry and browser-persistent research history.
- Service-worker cache version bumped and `clients.claim()` / activation update path enabled.

## Data note
`data/pyq_1300_master_v4.csv` contains 1,300 records (100/year for 2014–2026). Local full question/option text is present for 2014–2025. The 2026 layer is a topic/title inventory; the UI provides the official UPSC source path instead of fabricating or bundling the full paper text.

## Persistence note
The static Vercel/ZIP build provides durable local browser persistence (including a 365-day retention policy and backup/restore tooling). True server-side cloud persistence cannot be guaranteed by a static client-only ZIP without a configured database/backend. No claim of server-side synchronization is made by this QA report.

## AI network note
The application contains a real Gemini API integration and streaming parser. Automated tests used a mocked endpoint because this QA environment does not have the user's live API/network session. The UI therefore needs a valid API key and network access in the deployed browser for live responses.
