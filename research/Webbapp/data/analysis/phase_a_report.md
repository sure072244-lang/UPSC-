# PRECISION UPSC — PHASE A DATA FREEZE
## Scope
2014–2026 GS Paper-I PYQ corpus + source tracking + answer QA + trend baseline + post-2026 research registry.

## Freeze rules
1. Official UPSC paper is the paper source-of-record.
2. A claimed original/primary source for PYQ year Y must have publication/document date <= Y.
3. Later sources are retrospective corroboration only.
4. UPSC does not publicly disclose setter-source attribution; therefore `PRIMARY_VERIFIED` means proposition-level institutional evidence, not proof that UPSC setters used that exact document.
5. 2026 post-exam/current layer begins at the official paper upload cutoff (25 May 2026).
6. No mock question generation is enabled during Phase A.

## Corpus
- 2014–2026: 1300 nominal question records.
- Per-year count: 100 for every year in 2014–2026.
- Duplicate IDs: 0.
- Missing IDs: 0.
- 2017–2025 question-level metadata is preserved from the current training workbook where complete.
- 2026 remains an analytical inventory layer; the official scanned paper is the source-of-record.

## 2014–2016 source tracking
- 2014: 100 records; question-level primary attribution remains unverified.
- 2015: 100 records; question-level primary attribution remains unverified.
- 2016: 100 records; prior audited source ledger retained.
- 2016 audited status: {'UNVERIFIED': np.int64(87), 'PRIMARY_VERIFIED': np.int64(8), 'PRIMARY_CANDIDATE': np.int64(5)}.
- No later publication has been promoted as an original source.

## Research cross-checks
Independent 2014 analyses describe a broad mix of History/Culture, Geography, Polity, Economy, Science & Technology, Environment and current events; these are analytical classifications, not UPSC disclosures.
2015 independent analyses similarly emphasize Economy/Environment plus current events and conventional sources.
2016 question-level source analysis identifies newspapers, NCERT, Economic Survey and government websites as major research families, but those claims remain secondary unless proposition-level primary evidence is independently verified.

## Phase A exit criteria
- 2014–2026 identity freeze: PASS
- Source-date gate: ACTIVE
- Answer QA: ACTIVE; conflicts remain quarantined
- 2026 official-paper anchor: ACTIVE
- Post-2026 mock/current data: catalogued, not used as historical PYQ source
- Mock generation: OFF
- Portal integration: NEXT PHASE (Phase B)
