# UPSC CSE Prelims GS Paper-I — Source Tracking & Structural Audit (2017–2026)

## Scope
- Coverage requested: 2017–2026 (interpreting the user's "2027-26" as 2017–2026).
- 2017–2025: 900 question records from the existing master metadata.
- 2026: 100-question register created, but **not falsely populated** with guessed sources.
- Source rule locked: **original/primary source date must be <= PYQ year**.
- A secondary coaching/analysis page is never treated as the original source merely because it explains the question.

## What is included for every 2017–2025 question
1. Canonical question ID
2. Year and question number
3. Subject + micro-topic
4. Question architecture
5. Statement load
6. Negative-stem flag
7. Explicit CA flag + news cue
8. Answer / validity / cancellation flags from the master dataset
9. Research-routing source-family candidate (NOT an attribution)
10. Primary source fields
11. Primary-source date
12. Primary-source URL
13. Secondary source claim
14. Verification status
15. Proposition-level verification flag
16. Chronology check
17. Confidence
18. Audit note

## Important integrity rule
Blank primary-source fields are intentional. They mean **not yet verified**, not "no source exists".
No source has been invented to make the sheet look complete.

## 2026
UPSC officially published the 2026 GS Paper-I question paper on 25 May 2026. The official UPSC page confirms the examination date as 24 May 2026 and the GS-I upload on 25 May 2026.
For 2026, this package creates a 100-row audit register but does not assign question-level primary sources without proposition-level verification.

## Analytical dimensions to retain
- Subject and micro-topic recurrence
- Static / current / hybrid separation
- CA linkage versus primary subject
- Statement architecture
- Count/how-many architecture
- Pair/matching architecture
- Assertion/relationship architecture
- Negative wording
- Difficulty dimensions: conceptual depth, ambiguity, statement load, integration, elimination burden
- PYQ similarity fingerprint
- Source chronology
- Primary versus secondary source provenance
- Answer-key validity/cancellation
- Data-quality flags

## Source verification workflow
A question is marked PRIMARY_VERIFIED only when:
1. the exact proposition tested is found in an original institutional/primary document;
2. the document existed by the PYQ year;
3. the proposition supports the relevant option/statement, not merely the broad topic;
4. the URL/document identity is recorded;
5. chronology is checked;
6. secondary claims are kept separate from primary evidence.

## Current state
2017–2025 records: 900
2026 audit-register records: 100
2017–2025 primary-source verified in this package: 0 (conservative; no unsupported attribution)
2017–2025 unverified: 900

This is deliberate: it prevents the earlier failure mode where later publications were incorrectly treated as original sources for an older PYQ.
