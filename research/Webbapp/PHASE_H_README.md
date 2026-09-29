# PRECISION Phase H — Final QA / Release Candidate

This package is the final static PWA release candidate built from Phase G.

## Release gates
- 70+ registered features retained; feature registry is preserved.
- Phase B data vault + Phase C/D engine + Phase E/F intelligence/3D + Phase G AI/admin retained.
- Correct +2, Wrong -1/3, Blank 0 scoring retained.
- Water/ripple touch feedback on interactive controls.
- Responsive mobile navigation with horizontal bottom navigation.
- 3D human-body navigator on desktop; direct body-node routing.
- Fullscreen control retained.
- Offline PWA cache and network-state indicator.
- Timer autosave/recovery and wall-clock-safe tick accounting.
- Evaluation unlock recovery after the 60-minute lock.
- LocalStorage persistence for UI, AI settings, engine/evaluation state, countdown configuration and audit history.
- Static Vercel deployment configuration included.

## AI security
The Gemini API key is intentionally NOT embedded in this release package. Enter it in the portal's AI settings; it is kept in browser local storage. Gemini 3.8 Flash is the configured default model.

## Important release boundary
Mock question generation remains a separate controlled release gate. The portal can operate the 50-test engine, but this package does not invent or silently insert mock questions or answer keys.
