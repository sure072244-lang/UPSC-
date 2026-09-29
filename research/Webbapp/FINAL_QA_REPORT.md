# PRECISION V8.2-FINAL — Final QA Report

## Package integrity
- Release directory: V8.2-FINAL
- Files: 183
- Uncompressed size: ~45.75 MB (43.63 MiB)
- All pre-existing V8/V7 archive/source/data files in the worktree were retained.

## Automated QA
### Static QA — PASS
`python tests/phase_h_static_qa.py`

Validated:
- all required frontend/backend/config/data assets present
- JavaScript syntax for app, V8 layer, Cloudflare Worker, Vercel AI API and sync API
- 162-feature registry retained
- 1,300 PYQ records retained across 2014–2026 (100/year)
- 50 mock slots, 100 questions, 200 marks, 120 minutes, 09:30–11:30 window, unique paper codes
- Study Timer subject ledgers and persistence markers
- D-Day exact date/time gates
- OMR Review → Key Vault → Official Key → Evaluation wiring
- final-key 100/100 validation
- WebAuthn platform passkey markers
- black/glass/liquid UI markers
- lazy search-index loading / service-worker cache markers
- sidebar navigation coverage (21 view targets)
- no Gemini/Mistral/Vercel secret literals in the release package

### V8 functional smoke — PASS
`node tests/v8_functional_smoke.js`

Validated:
- safe boot order prevents the previous blocking legacy render path
- Study Timer elapsed-time and paused-time arithmetic
- D-Day before/open/closed boundaries
- 100-answer key validation and incomplete-key blocking
- +2 / −1/3 / 0 scoring arithmetic
- OMR page geometry: 50 questions/page, 4 options/question
- Mistral backend secret lookup + streaming route markers
- D1 answer-key table and API route
- platform passkey wiring

### Legacy Phase-H behavioral QA — PASS
`node tests/phase_h_behavioral_qa.js`

- 50 behavioral checks
- score 3.67
- timer checks 22
- round-1 checks 15
- round-2 checks 7
- module check 1

### Synthetic OMR calibration test — PASS
The bundled A4 SVG templates were rendered to 794×1123 PNGs, known filled bubbles were placed using the portal calibration coordinates, and the same center-disk threshold logic recovered:
- Page 1: 50/50
- Page 2: 50/50

## Important verification limits
Automated tests cannot reproduce every Android Chrome / Redmi Pad SE WebAuthn prompt, scanner camera perspective, printer scaling error, network outage, or a live provider API account. Therefore the release is QA-validated at code/data/integration level, but real-device acceptance still requires opening the production hostname and performing one passkey registration, one live Mistral request, one printed-OMR scan, and one D-Day test-window check.

## Security decision
Provider API keys are **not embedded** in the public package. They must be supplied to the backend as secrets/environment variables. Any provider key pasted into chat or source must be rotated/revoked.
