# PRECISION UPSC GS-I Portal — v5 Study Tracker / OMR Release

## Major fixes
- Reworked dashboard to a light glass Study Tracker-style control room with study time, streak, sessions, 14-day activity graph, countdowns and quick access.
- Added functional PYQ theme/topic/format/CA/negative/news/source-status filters plus CSV/JSON export.
- PYQ filter state now initializes correctly; the database no longer becomes blank because of undefined new filters.
- 2016 uploaded source-tracking file is linked into the 1,300-record PYQ master as a separate evidence layer; no unverified candidate was promoted to primary verification.
- Global test timer remains visible while navigating across panels.
- UPPSC countdown remains on the dashboard only; UPSC countdown typography is reduced slightly and UPPSC further reduced.
- Reworked mock-test flow with random non-sequential paper codes, exact paper-code verification, 2-minute countdown, 120-minute recoverable timer, completion → OMR direct flow.
- Reworked OMR flow: clear detections are auto-saved, ambiguous/multiple marks remain for manual correction, extraction metadata is persisted.
- Answer-key vault now requires the exact paper code and exactly 100 valid answers, stores a paper-code binding, and provides view/export access later.
- Evaluation queue preserves answer/key snapshots and keeps the existing +2 / −1/3 / 0 scoring rule.
- Added Study Tracker sessions with start/pause/resume/finish, subject totals, streaks, daily goal and export/reset controls.
- Added device-lock mode using the browser's platform authenticator where supported; removed the old Admin PIN flow.
- AI navigation now routes to the Gemini operator/analyst view, with local commands and controlled UI actions preserved.
- Gemini model remains `gemini-3.8-flash`; API credentials are intentionally not embedded in the ZIP.
- Light-theme visual polish, liquid/water interaction feedback, mobile handling and recovery UI retained.

## Validation
- Node syntax check: PASS
- Phase H behavioral QA: PASS
- Phase H static QA: PASS
- PYQ records: 1,300; IDs unique; years 2014–2026
- Mock registry: 50 slots; 100 questions; 200 marks; 120 minutes; unique paper codes
