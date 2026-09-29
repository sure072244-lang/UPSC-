# PRECISION UPSC Training State — 2017–2026 + Post-2026 Mock Intelligence — v2

## Scope
- 2017–2026: 1,000 nominal GS-I PYQ records (10×100), consolidated into one descriptive source-tracking ledger.
- 2017–2025: question text extracted from public reproduction/solution PDFs in the working corpus for analysis; the official UPSC archive remains the source-of-record.
- 2026: official UPSC paper is the source-of-record; public post-exam inventories provide topic/subject cross-checks. Full scanned stems are not re-OCRed in this build.
- Current mock intelligence is hard-gated to public content/structured programs published or started on/after 2026-05-25.

## Critical provenance rule
For PYQ year Y, an accepted original/primary source must be dated <= Y and match the proposition at question level. UPSC does not publish setter-source attribution; therefore a verified primary document means proposition support, not proof that the setter used that document.

## 2017–2025 analytical shifts
- Aggregate subject counts in this classifier: {'Polity & Governance': 142, 'History': 107, 'Economy': 178, 'Environment & Ecology': 151, 'Art & Culture': 39, 'Science & Technology': 123, 'Current Affairs': 55, 'Geography': 99, 'International Relations': 5, 'Sports': 1}.
- Early snapshot (2017–2018) vs recent snapshot (2024–2025): early={'Polity & Governance': 36, 'History': 25, 'Economy': 46, 'Environment & Ecology': 31, 'Art & Culture': 11, 'Science & Technology': 25, 'Current Affairs': 11, 'Geography': 14, 'International Relations': 1}; recent={'Geography': 31, 'Current Affairs': 15, 'Environment & Ecology': 27, 'Science & Technology': 29, 'Economy': 36, 'Art & Culture': 7, 'History': 19, 'Polity & Governance': 33, 'International Relations': 3}.
- Format architecture changed materially: 2017–2021 was dominated by multi-statement/single-answer forms in the working taxonomy; 2022 introduced explicit counting; 2023–2025 show substantial growth of count and assertion/relationship families.
- Mean statement load in the working classifier: 2020=2.21, 2022=2.35, 2025=2.11; these are derived taxonomy metrics, not UPSC labels.
- Negative/least/incorrect-style stems remain a recurring elimination burden; the tracker stores a dedicated flag.
- Current-affairs linkage is kept separate from Primary Subject to avoid double-counting dynamic context as a subject.

## 2026 evidence layer
- UPSC official paper format baseline remains 100 questions, 200 marks, 2 hours, with negative marking; the official archive is the source of record.
- UnlockIAS public inventory classifies 2026 into subject buckets; these are editorial categories, not official UPSC labels.
- Anantam/EaseMyPrep/Vision analyses independently describe a reasoning-heavy paper with coded statements, counting, relationship/inference, matching, and scenario/case formats. These are analytical buckets.
- Three scenario/public-administration case questions (Q76–Q78) are explicitly visible in the public 2026 inventory; treat this as a verified question-structure observation, while the interpretation “ethics in GS-I” remains analytical.

## Source tracking status
- Current consolidated 2017–2026 ledger retains unresolved primary sources as UNVERIFIED rather than guessing. Status counts from the starting inventory: {'UNVERIFIED': 1000}.
- A deterministic research route is provided for every question based on the primary subject; route ≠ attribution.
- 2023 and 2024 question-wise secondary solution pages are linked in the ledger; 2025 uses VisionIAS analysis; 2026 uses UnlockIAS/Legacy IAS/Anantam/EaseMyPrep as secondary layers.

## Post-2026 mock ecosystem — usable signals
- PMF: 2027 program started 1 July 2026; ~11,000 MCQs, 5,000 static, 4,000 CA, 20 full-length tests.
- Testbook: public 2027 catalog updated 10 September 2026; 123 GS chapter, 24 CA, 26 CSAT chapter, 5 subject, 20 full tests plus PYQ entries.
- ForumIAS: 2027 schedule uses sectional → comprehensive → simulator → CA layers, with 40 GS, 20 CSAT and 5 CA tests in the cited public structure.
- InsightsIAS: 2027 series starts 29 August 2026; 34 GS sectional, 2 CA, 12 GS full-length, 12 CSAT in the cited public structure.
- ClearIAS: 40 GS mocks with NCERT, standard-textbook, CA and full-topic layers in the cited public catalog.
- Indian Express public weekly quizzes provide a post-2026 current-affairs stream that blends recent issues with static concepts.

## What the mock engine may learn now (without generating mocks)
1. Use historical PYQs for structural priors: subject rotation, statement load, negative stems, count/relationship/matching architectures, and static-current integration.
2. Use 2026 as the most recent official style anchor, but do not treat third-party taxonomy as official UPSC labeling.
3. Use post-2026 2027 provider catalogs and public quizzes as ecosystem/currentness signals, not as proof of prediction or “hits”.
4. Keep source provenance, question construction, answer validation, bilingual equivalence, duplicate detection, and publication-date gate as separate release stages.

## Explicit non-claims
- No claim that all 1,000 original setter sources are known.
- No claim that provider “most probable/direct hit” marketing statements establish predictive validity.
- No unseen paid/gated mock questions were reconstructed.
- No mock paper is generated in this training-state build.