# UPSC CSE Prelims GS Paper-I PYQ Intelligence Report — 2014–2026

## Corpus lock
- 2014–2026 inclusive is 13 papers × 100 = **1,300 nominal questions** (not 1,400).
- 2014–2025: 1,200 question records parsed from the supplied PDFs.
- 2026: the uploaded UPSC paper is the official visual/layout source; its text layer is image-only, so question-level structural counts are cross-checked against a current question-by-question analysis.

## QA / data integrity
- 2014–2025: 1200/1,200 records have four option slots and 1200/1,200 have a valid answer letter in the supplied extraction.
- 8 questions are explicitly marked cancelled in the supplied 2014–2025 corpus.
- 29 records contain blanked/missing table/list fields in the supplied coaching PDFs. These are flagged and are **not** treated as trusted text exemplars.
- Visual inspection confirms the 2025 source itself shows blank I/II/III rows for Q79–Q80; an external source contains question text, but set-level mapping is kept separate rather than guessed.
- Future mock rule: a flagged question cannot enter the final generation pool until exact text is independently verified.

## Subject distribution — 2014–2025
|   year |   Economy |   Environment & Ecology |   Polity & Governance |   Science & Technology |   History |   Geography |   Current Affairs |   Art & Culture |   International Relations |   Sports |
|-------:|----------:|------------------------:|----------------------:|-----------------------:|----------:|------------:|------------------:|----------------:|--------------------------:|---------:|
|   2014 |        14 |                      22 |                    10 |                     17 |         8 |          13 |                 3 |              13 |                         0 |        0 |
|   2015 |        23 |                      18 |                    12 |                     10 |        13 |          11 |                 9 |               4 |                         0 |        0 |
|   2016 |        26 |                      22 |                     5 |                     13 |        12 |           6 |                11 |               5 |                         0 |        0 |
|   2017 |        26 |                      16 |                    22 |                     10 |        10 |           6 |                 5 |               4 |                         1 |        0 |
|   2018 |        20 |                      15 |                    14 |                     15 |        15 |           8 |                 6 |               7 |                         0 |        0 |
|   2019 |        26 |                      18 |                    14 |                     16 |        11 |           9 |                 2 |               4 |                         0 |        0 |
|   2020 |        21 |                      19 |                    16 |                     14 |        18 |           8 |                 2 |               2 |                         0 |        0 |
|   2021 |        15 |                      24 |                    17 |                     12 |        15 |           7 |                 5 |               5 |                         0 |        0 |
|   2022 |        17 |                      17 |                    11 |                     17 |        12 |          12 |                10 |               4 |                         0 |        0 |
|   2023 |        17 |                      15 |                    15 |                     10 |         7 |          18 |                10 |               6 |                         1 |        1 |
|   2024 |        15 |                      14 |                    20 |                     13 |         4 |          18 |                 9 |               6 |                         1 |        0 |
|   2025 |        21 |                      13 |                    13 |                     16 |        15 |          13 |                 6 |               1 |                         2 |        0 |

### Aggregate
| subject                 |   questions |
|:------------------------|------------:|
| Economy                 |         241 |
| Environment & Ecology   |         213 |
| Polity & Governance     |         169 |
| Science & Technology    |         163 |
| History                 |         140 |
| Geography               |         129 |
| Current Affairs         |          78 |
| Art & Culture           |          61 |
| International Relations |           5 |
| Sports                  |           1 |

These counts follow the subject taxonomy embedded in the supplied PDFs; they are an analytical tagging layer, not an official UPSC subject classification.

## Trend shifts
|           |   Economy |   Environment & Ecology |   Polity & Governance |   Science & Technology |   History |   Geography |   Current Affairs |   Art & Culture |   International Relations |   Sports |
|:----------|----------:|------------------------:|----------------------:|-----------------------:|----------:|------------:|------------------:|----------------:|--------------------------:|---------:|
| 2014-2018 |      21.8 |                   18.6  |                 12.6  |                   13   |      11.6 |        8.8  |              6.8  |            6.6  |                       0.2 |     0    |
| 2019-2023 |      19.2 |                   18.6  |                 14.6  |                   13.8 |      12.6 |       10.8  |              5.8  |            4.2  |                       0.2 |     0.2  |
| 2024-2025 |      18   |                   13.5  |                 16.5  |                   14.5 |       9.5 |       15.5  |              7.5  |            3.5  |                       1.5 |     0    |
| 2022-2025 |      17.5 |                   14.75 |                 14.75 |                   14   |       9.5 |       15.25 |              8.75 |            4.25 |                       1   |     0.25 |
- Geography: 8.80 → 15.50 per paper (+6.70).
- Polity & Governance: 12.60 → 16.50 per paper (+3.90).
- Economy: 21.80 → 18.00 per paper (-3.80).
- Environment & Ecology: 18.60 → 13.50 per paper (-5.10).
- Science & Technology: 13.00 → 14.50 per paper (+1.50).
- History: 11.60 → 9.50 per paper (-2.10).
- Art & Culture: 6.60 → 3.50 per paper (-3.10).
- Current Affairs: 6.80 → 7.50 per paper (+0.70).
- International Relations: 0.20 → 1.50 per paper (+1.30).

These are observed frequency changes, not deterministic predictions.

## Format evolution — 2014–2025
|   year |   Single-answer |   Multi-statement |   How-many/Count |   Match/Pair |   Assertion/Relationship |
|-------:|----------------:|------------------:|-----------------:|-------------:|-------------------------:|
|   2014 |              46 |                42 |                0 |           12 |                        0 |
|   2015 |              59 |                39 |                0 |            2 |                        0 |
|   2016 |              53 |                43 |                0 |            4 |                        0 |
|   2017 |              53 |                44 |                0 |            3 |                        0 |
|   2018 |              42 |                55 |                0 |            3 |                        0 |
|   2019 |              51 |                43 |                0 |            6 |                        0 |
|   2020 |              41 |                54 |                0 |            5 |                        0 |
|   2021 |              46 |                53 |                0 |            1 |                        0 |
|   2022 |              30 |                61 |                8 |            1 |                        0 |
|   2023 |              28 |                 7 |               47 |            0 |                       18 |
|   2024 |              27 |                42 |               18 |            0 |                       13 |
|   2025 |              18 |                41 |               27 |            0 |                       14 |

A structural change is visible from 2022 onward: more count/relationship-style questions, with 2025 using a much higher share of count/statement-hybrid wording.

## Statement load
|   year |   0 |   1 |   2 |   3 |   4 |   5 |
|-------:|----:|----:|----:|----:|----:|----:|
|   2014 |  36 |   0 |  11 |  36 |  15 |   2 |
|   2015 |  54 |   0 |  15 |  23 |   5 |   3 |
|   2016 |  44 |   0 |  21 |  31 |   2 |   2 |
|   2017 |  42 |   0 |  22 |  32 |   4 |   0 |
|   2018 |  41 |   1 |  22 |  24 |   8 |   4 |
|   2019 |  48 |   0 |  12 |  25 |  12 |   3 |
|   2020 |  36 |   0 |   6 |  29 |  23 |   6 |
|   2021 |  42 |   0 |  14 |  29 |   8 |   7 |
|   2022 |  28 |   0 |  12 |  35 |  19 |   6 |
|   2023 |  45 |   1 |   7 |  30 |  15 |   2 |
|   2024 |  39 |   1 |  33 |  16 |  10 |   1 |
|   2025 |  31 |   0 |  16 |  38 |  10 |   5 |

## Difficulty labels
|   year |   easy |   moderate |   difficult |
|-------:|-------:|-----------:|------------:|
|   2014 |     41 |         57 |           2 |
|   2015 |     45 |         54 |           1 |
|   2016 |     46 |         54 |           0 |
|   2017 |     38 |         59 |           3 |
|   2018 |     36 |         60 |           4 |
|   2019 |     35 |         58 |           7 |
|   2020 |     29 |         63 |           8 |
|   2021 |     40 |         51 |           9 |
|   2022 |     31 |         66 |           3 |
|   2023 |     29 |         62 |           9 |
|   2024 |     35 |         59 |           6 |
|   2025 |     30 |         66 |           4 |

Difficulty labels are inherited from the supplied coaching/aggregator files; UPSC does not publish an official per-question difficulty label.

## Elimination-compatible architecture
- 706/1,200 (58.8%) are structurally elimination-compatible: multi-statement, count, match or assertion/relationship.
- 494/1,200 (41.2%) are direct single-answer structures.
- This is a question-design metric, not a claim that the same percentage can actually be solved by elimination.

## Negative / stem-discipline load
- 112/1,200 (9.3%) contain an explicit negative/exception cue under the parser.

## Current-affairs architecture
- Explicit 'Current Affairs' tagging appears on 78 of 1,200 supplied 2014–2025 questions.
- 89 stems contain a recent/news cue such as 'recently' or 'in the news'.
- Current affairs is structurally integrated: the current trigger can sit inside Economy, Environment, Geography, Polity, S&T, History, Art & Culture or IR.

## Recurring topic families — top 25
| subtopic                                        |   all_2014_25 |   years_present |   early_2014_18 |   recent_2021_25 |
|:------------------------------------------------|--------------:|----------------:|----------------:|-----------------:|
| Computer & Information Technology               |            32 |              10 |              14 |                8 |
| Agriculture & Rural Development                 |            29 |              11 |              15 |                6 |
| International Environmental Treaties & Summits  |            29 |              10 |              22 |                6 |
| Parliament & State Legislatures                 |            28 |              12 |              15 |                8 |
| International Organisations & Groupings         |            25 |              11 |              12 |               12 |
| Constitutional Framework & Development          |            25 |               9 |               4 |               15 |
| Pollution & Waste Management                    |            24 |              10 |               5 |               13 |
| Protected Areas & Wildlife                      |            24 |               9 |              12 |                2 |
| Ecosystems & Ecology Concepts                   |            23 |               9 |               9 |               13 |
| Sustainable Agriculture & Forestry              |            23 |               8 |              10 |                9 |
| Climate Change & Greenhouse Gases               |            22 |              11 |               8 |               11 |
| Financial Markets & Capital Markets             |            21 |              10 |               4 |               14 |
| Human Development, Poverty & Employment Schemes |            21 |               7 |              10 |                6 |
| Energy & Environment                            |            20 |              11 |               9 |                8 |
| Fiscal Policy & Budget                          |            20 |              10 |               9 |                9 |
| Health & Diseases                               |            20 |              10 |               8 |                9 |
| Biotechnology & Genetics                        |            19 |              11 |               7 |                7 |
| Environmental Governance & Legislation          |            19 |              11 |               9 |                7 |
| Atmosphere & Climatology                        |            19 |              10 |               5 |               12 |
| Biodiversity & Conservation                     |            19 |              10 |              10 |                7 |
| Space Technology & Astronomy                    |            18 |              12 |               9 |                6 |
| Digital Payments & Financial Inclusion          |            18 |              10 |              11 |                6 |
| Banking & Financial Sector                      |            18 |               9 |               7 |                5 |
| Infrastructure & Industry                       |            18 |               8 |               9 |                6 |
| International Relations & Treaties              |            17 |               8 |               8 |                6 |

## 2026 official-paper baseline
- UPSC's official 2026 exam page confirms the exam date and the upload of General Studies Paper-I. The official previous-paper page lists the 2026 GS-I PDF. citeturn850429search0turn850429search1

### 2026 broad analytical allocation
|                                           |   questions |
|:------------------------------------------|------------:|
| History                                   |          13 |
| Art & Culture                             |           8 |
| Geography                                 |           7 |
| Environment & Ecology                     |           8 |
| Economy                                   |          18 |
| Science & Technology                      |          15 |
| Polity & Governance                       |           9 |
| Current Affairs + International Relations |          19 |
| Ethics/Governance Case                    |           3 |

- Boundary questions can move between subject buckets; the cited analyst explicitly treats the knowledge required to answer as the organizing rule. citeturn451743view1

### 2026 format allocation
|                                  |   questions |
|:---------------------------------|------------:|
| Coded statement                  |          55 |
| Direct single-answer             |          19 |
| How-many/count                   |           7 |
| Statement relationship/inference |           7 |
| Match pairs                      |           4 |
| Match list                       |           4 |
| Scenario/case study              |           4 |

- The 2026 analysis reports 69 questions requiring multi-claim judgement when coded-statement and relationship forms are combined, 19 direct, 8 pair/list matching, 7 count-based and 4 scenario/case questions. citeturn451743view3

### 2026 source-family calibration — third-party estimate
|                                  |   estimated_questions |
|:---------------------------------|----------------------:|
| PIB/Government press releases    |                    24 |
| NCERT                            |                    22 |
| Current-affairs news             |                    16 |
| Domain-specific sources          |                    10 |
| Standard references              |                    10 |
| International-organisation sites |                     8 |
| Acts/statutes                    |                     6 |
| Yojana/Kurukshetra               |                     4 |

- UPSC/PIB states that references in the 2026 paper can include standard textbooks, journals, government websites, government press releases and reputed newspapers. citeturn946175search2
- The bucket counts above are external estimates, not UPSC disclosures.

## 2026 style shift
- Economy was strongly mechanism-oriented; S&T emphasized how specific technologies/missions work; current-affairs/IR frequently tested institutions, functions, locations and implications; history/culture used source/evidence-oriented framing. citeturn451743view1turn451743view2

## Mock-generation rules now locked
1. 2026 official grammar first: 100 questions, 200 marks, 2 hours, four-option GS-I architecture, bilingual Hindi + English.
2. Long-run 2014–2025 subject/topic priors.
3. Recent-shift weighting without treating trends as guaranteed predictions.
4. Current-affairs linkage as a separate field from primary subject.
5. Controlled elimination patterns and misconception-based distractors.
6. Difficulty from depth, ambiguity, statement load, integration and elimination burden — not copied coaching labels.
7. Similarity/fingerprint checks so mocks do not merely paraphrase PYQs.
8. One canonical ID for the English and Hindi versions.
9. Per-question provenance with source type, document/URL, verification date and confidence.
10. Release gate: content → answer → bilingual equivalence → duplicate scan → format balance → final key audit.

## Status
**PYQ phase analytically locked.** Coaching mock PDFs can be added next without changing the core schema.