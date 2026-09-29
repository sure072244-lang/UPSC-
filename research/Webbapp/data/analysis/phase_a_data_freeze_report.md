# PRECISION UPSC — Phase A Data Freeze (2014–2026)

Generated: 2026-09-24T07:23:34.897487+00:00

## Scope frozen
- 2014–2026 GS Paper-I nominal corpus: **1,300 question records**.
- 2014–2016 were normalized into the same 39-field data contract used for 2017–2026.
- The user-uploaded workbook is the current 2017–2026 source layer; prior 2014–2016 research material is preserved as a separate historical/source-tracking layer.
- Official UPSC archive remains the source-of-record for paper identity and exact paper text.

## Source-tracking rule
For PYQ year Y, an accepted original/primary source must have publication/document date <= Y and must support the exact proposition. A later webpage may corroborate a historical interpretation but is never backdated into the original-source field.

**Setter attribution is not asserted.** UPSC does not publish setter-source provenance. A primary document in this database means “proposition supported by this document”, not “UPSC definitely used this document”.

## 2014–2016 normalization
- 300 rows normalized.
- 2016 source-tracker statuses preserved, including the verified/candidate/unverified distinction.
- 2014–2015 source research remains `RESEARCH_LEAD` where proposition-level primary evidence has not yet been established.
- Secondary analysis is explicitly labeled and separated from primary-source evidence.

## Current structural analysis
- Populated taxonomy currently contains **174 unique subtopics**.
- Historical subject/format/statements/current-affairs metrics are frozen year-by-year.
- Current-affairs tagging is kept separate from primary subject.
- 2026 is treated as the latest official style anchor, but its detailed question-text/subtopic layer is not silently reconstructed from secondary reproductions.

## Post-2026 research layer
The phase includes public, post-2026 test/quiz ecosystem evidence from ForumIAS, PMF IAS, InsightsIAS, Testbook, ClearIAS, Drishti IAS, Vajiram & Ravi and Indian Express, plus 2026 analytical cross-checks from VisionIAS, UnlockIAS and AnantamIAS.

These sources are used for **ecosystem/style/topic signals only**. Gated or unseen mock questions are not inferred.

## Answer QA
Current working corpus contains **7 unresolved answer-key conflicts**. They remain blocked rather than silently overwritten. Separate authoritative-key reconciliation is required before any affected record can be admitted to a clean mock pool.

## 2026 limitation
The frozen 2026 layer contains 100 nominal rows, while independent public analyses report one dropped item / 99 evaluated. This is not treated as a contradiction: the database preserves a 100-row paper identity layer plus an evaluation-status caveat.

## 15-year forecasting
Not enabled in Phase A because 2014–2026 is 13 years. Adding 2011–2013 is required before claiming a literal 15-year historical forecast.

## Phase-A release gate
1. 1,300 unique question IDs — PASS
2. 100 questions/year identity — PASS
3. source-year rule encoded — PASS
4. setter-source claims quarantined — PASS
5. answer conflicts blocked — PASS
6. post-2026 mock cutoff locked at 2026-05-25 — PASS
7. gated mock content not inferred — PASS
8. 2026 text limitation documented — PASS
9. mock generation — **OFF / LOCKED**

## Inputs retained
- Current uploaded workbook: `PRECISION_UPSC_Training_State_2017_2026_v2-7.xlsx`
- Historical 2014–2016 research source: `PRECISION_UPSC_Training_State_2014_2026_V5.xlsx`
- Existing 2017–2026 descriptive source tracker
- Existing post-2026 mock ecosystem
- Existing answer-QA flags