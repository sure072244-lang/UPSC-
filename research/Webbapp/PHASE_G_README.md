# PRECISION Phase G — AI / Admin

Implemented on top of Phase E+F without removing Phase B/C/D/E/F data or engine artifacts.

## AI
- Gemini Developer API `generateContent` integration.
- Streaming analyst path via `streamGenerateContent?alt=sse`.
- Optional Google Search grounding for current research.
- Database-oriented retrieval from the linked 2014–2026 PYQ corpus, QA/source layers, research/mock layers, and derived statistics.
- Controlled command actions only; no arbitrary JavaScript execution.
- Local runtime modules: note, metric, checklist, link, countdown.

## Admin
- Local page editor for title/note.
- Personal-use controls.
- Countdown calendar for UPPSC 2026 and UPSC 2027 targets.
- Local version history with undo and export.
- AI history.

## Training
- Training Ground / Test Engine navigation is open in this phase.
- The research corpus remains immutable.

## Security
- API key is NOT hardcoded into the ZIP. It is read from browser localStorage after the user saves it in AI settings. This avoids publishing the credential inside a static site.
