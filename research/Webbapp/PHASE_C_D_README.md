# PRECISION — Phase C + D Test Engine / OMR Evaluation

This build extends the Phase B integrated portal with the production test-execution architecture and evaluation workflow for UPSC CSE Prelims 2027 GS-I.

## Phase C — Test Engine
- Mock 01–50 immutable test registry
- Unique paper code per test
- Exact test-number + paper-code verification
- D-Day access window 09:30–11:30 local browser time
- Two-minute pre-start countdown with refresh recovery
- Two-hour attempt timer
- Round 1 / Round 2 timing
- Pause/resume with local autosave
- Offline-capable state recovery through localStorage + PWA cache
- Completion snapshot and attempt history
- Dry-run engine mode for QA without bypassing production time gates

## Phase D — OMR / Evaluation
- OMR image upload and preview
- Portal-standard 100-question, 4-option OMR extraction adapter
- Page 1 (Q1–50) and Page 2 (Q51–100) extraction; detected answers merge
- Ambiguous marks are surfaced for manual correction rather than silently guessed
- Manual 1–100 answer entry
- Exact paper-code verification
- Answer-key sync through CSV or JSON
- Complete 100-answer key required before evaluation queue submission
- Evaluation queue with 60-minute locked result window
- One-by-one processing metadata preserved in the queue snapshot
- Detailed question-level result
- UPSC-style arithmetic: +2 correct, -2/3 wrong, 0 blank
- Test-to-test comparison history

## Important release discipline
No mock questions or answer keys have been fabricated in this phase. The engine is ready to consume an approved question pack and answer key when the mock-generation phase is explicitly released.

## OMR templates
`omr_template_page_1.svg` = Q1–50
`omr_template_page_2.svg` = Q51–100

For reliable automatic extraction, use these portal-standard templates. Other OMR formats require manual correction/calibration and are not silently interpreted as equivalent.
