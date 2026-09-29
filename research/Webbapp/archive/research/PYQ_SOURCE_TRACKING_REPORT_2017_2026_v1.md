# UPSC CSE Prelims GS-I PYQ Source Tracking — 2017–2026 — v1

## Scope
- 2017–2026 = 10 papers × 100 = **1,000 nominal question records**.
- 2017–2025 uses the existing question-level metadata corpus.
- 2026 uses the supplied 2026 question reproduction for inventory/cross-checking; UPSC's official paper remains the source-of-record.
- This package does **not** manufacture setter-source attribution.

## Locked source-verification rule
For a PYQ from year **Y**, an accepted original/primary source must have a document/publication date **≤ Y** and must support the proposition at question level.

A later article may be used only as retrospective corroboration. It is not promoted to the original-source field.

## Status discipline
- `PRIMARY_VERIFIED`: primary institutional document found, dated ≤ PYQ year, and proposition-level evidence checked.
- `PRIMARY_CANDIDATE`: plausible primary document identified, but final proposition-level archival verification remains.
- `SECONDARY_CLAIM_ONLY`: a coaching/analysis source attributes a source, but the underlying primary evidence is not yet verified.
- `UNVERIFIED`: no defensible primary attribution has been established yet.
- `NOT DISCLOSED BY UPSC`: UPSC does not publish setter-source attribution; therefore a verified document means “the proposition is supported by that primary source,” not “UPSC definitely used that source.”

## What has been deliberately NOT done
1. No guessed NCERT/book/PIB/newspaper attribution.
2. No later source has been backdated to the PYQ year.
3. No coaching analysis has been treated as proof of setter provenance.
4. Cancelled/flagged questions remain blocked from mock-generation use.
5. 2026 analytical classifications are kept separate from official UPSC labels.

## 2026 official baseline
UPSC's official 2026 examination page records the exam on 24 May 2026 and the upload of GS Paper-I on 25 May 2026. The official previous-question-paper repository lists the 2026 GS-I PDF. citeturn0search2turn0search1

An external 2026 analysis reports a reasoning-heavy architecture (55 coded-statement, 19 direct, 7 count, 7 relationship/inference, 4 pair matching, 4 list matching, 4 scenario/case). These are analytical buckets, **not official UPSC classifications**.

## 2017–2025 analytical dimensions retained
Each question carries:
- primary subject + subtopic
- difficulty tag (source-derived, not an official UPSC difficulty label)
- format
- statement count
- negative-stem flag
- explicit current-affairs flag
- news-cue flag
- stem length
- option count
- answer validity/cancellation status
- data-quality flags
- content fingerprint
- source-year gate
- primary-source verification status
- secondary-source claim field
- setter-source attribution field
- mock-pool eligibility gate

## Important analytical finding
Source mapping and question classification are separate layers. A question may be current-affairs triggered while the knowledge tested is Economy, Geography, Polity, Environment, etc. Therefore the database preserves **Primary Subject** and **Current-Affairs Linkage** separately rather than creating a standalone “current affairs” bucket for every news-linked question.

## Current research limitation
This v1 package is a **complete 2017–2026 question inventory and source-verification ledger**, not a claim that all 1,000 primary sources have already been independently proven. The correct workflow is to fill primary-source evidence question-by-question and leave unresolved records explicitly unverified rather than introduce false certainty.

## 2026 secondary-source caution
The supplied 2026 PDF is an UnlockIAS reproduction/solution document. It is useful for question-text cross-checking, but it is not evidence that UnlockIAS or any named source was the setter's source. UPSC's official repository remains the paper source-of-record.

## QA gate for the final mock engine
A question remains `BLOCKED_UNTIL_SOURCE_QA` until:
1. exact proposition is matched,
2. primary source date passes the year gate,
3. source URL/document is archived,
4. source claim is classified as static/current/hybrid,
5. cancellation/data-quality status is checked,
6. answer is independently audited,
7. bilingual equivalence is checked,
8. duplicate/similarity fingerprint is checked.

## Files
- `PYQ_SOURCE_TRACKING_2017_2026_MASTER_v1.csv`
- `PYQ_ANALYSIS_2017_2026_YEAR_SUMMARY_v1.csv`
- `PYQ_QA_FLAGS_2017_2026_v1.csv`
- `PYQ_FORMAT_BY_YEAR_2017_2025_v1.csv`
- `PYQ_SUBJECT_BY_YEAR_2017_2025_v1.csv`
