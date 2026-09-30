"""Read-only research aggregates bundled with the application."""

import csv
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends

from routers.passkeys import require_auth

router = APIRouter(
    prefix="/research", tags=["research"], dependencies=[Depends(require_auth)]
)
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "research"


@lru_cache(maxsize=16)
def _json_file(filename: str) -> dict[str, Any]:
    with (DATA_DIR / filename).open(encoding="utf-8") as source:
        return json.load(source)


@lru_cache(maxsize=16)
def _csv_file(filename: str) -> tuple[dict[str, str], ...]:
    with (DATA_DIR / filename).open(newline="", encoding="utf-8-sig") as source:
        return tuple(csv.DictReader(source))


@lru_cache(maxsize=1)
def _pyq_text_coverage() -> dict[str, int]:
    active_file = DATA_DIR.parent / "pyq_master_2014_2026.csv"
    with active_file.open(newline="", encoding="utf-8-sig") as source:
        active_ids = {row["id"] for row in csv.DictReader(source) if row.get("id")}
    rich_rows = _csv_file("pyq_text_master_2014_2026.csv")
    matched = [row for row in rich_rows if row.get("id") in active_ids]
    return {
        "full_text_questions": sum(row.get("text_quality") == "FULL_TEXT" for row in matched),
        "topic_title_only_questions": sum(row.get("text_quality") == "TOPIC_TITLE_ONLY" for row in matched),
        "without_research_text": len(active_ids - {row.get("id") for row in matched}),
    }


@router.get("/dashboard")
async def dashboard() -> dict[str, Any]:
    """Return bundled UPSC research, keeping empirical and supplied data distinct."""
    mains = _json_file("mains_gs_trend_2013_2026.json")
    weightage = _json_file("subject_weightage_v861.json")
    taxonomy = _json_file("study_subjects_v6.json")
    pyq_summary = _json_file("pyq_2014_2026_summary_v4.json")
    schedule = _json_file("schedule_2027_v1.json")
    yearly_prelims = _csv_file("subject_by_year_2014_2026.csv")
    recurrence = _csv_file("subtopic_recurrence_2014_2026.csv")
    optional_labels = [
        entry["label"] for entry in taxonomy if entry.get("group") == "Optional"
    ]
    text_coverage = _pyq_text_coverage()

    return {
        "prelims": {
            "summary": pyq_summary,
            "subject_by_year": yearly_prelims,
            "subtopic_recurrence": recurrence,
            "source_note": "Question and topic labels follow the bundled research classification; they are not UPSC setter-source disclosures.",
        },
        "mains": mains,
        "weightage": weightage,
        "subject_catalog": taxonomy,
        "schedule": schedule,
        "coverage": {
            "prelims_questions": pyq_summary.get("nominal_questions", 0),
            "prelims_years": pyq_summary.get("scope", ""),
            **text_coverage,
            "mains_topic_rows": len(mains.get("rows", [])),
            "mains_years": mains.get("years", []),
            "taxonomy_subjects": len(taxonomy),
            "optional_subject_labels": optional_labels,
            "full_optional_syllabus_available": False,
            "mains_trend_independently_verified": False,
            "scheduled_test_papers": schedule.get("total_papers", 0),
            "schedule_is_upsc_official": False,
        },
    }