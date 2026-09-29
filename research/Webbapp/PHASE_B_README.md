# PRECISION — Phase B Data Vault

Integrated data package for the personal UPSC CSE Prelims 2027 GS-I portal.

## Data hierarchy
- `data/core/` — frozen PYQ master, source tracking, source registry, answer QA and release gates.
- `data/analysis/` — year/subject/format/CA analysis, recurrence, Phase A reports and PYQ analysis package.
- `data/research/` — post-2026 mock ecosystem, public quiz stream, research registry and calibration.
- `data/coaching/` — coaching schedule and mock-analysis intelligence.
- `database/precision_upsc_phase_b.sqlite` — bundled SQLite source database.
- `data/search_index.json` — offline browser-search index used by the portal.
- `data/PORTAL_DATA_MANIFEST_PHASE_B.json` — manifest and SHA-256 inventory.

## Release lock
Mock generation remains OFF. No mock questions or answer keys are generated in Phase B.

## Search
The portal's Data Vault has global search across the bundled datasets and a PYQ question-level explorer for 2014–2026.
