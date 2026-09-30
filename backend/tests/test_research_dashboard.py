import pytest

from routers.research import dashboard
from routers.pyq import _text_details, question_detail


@pytest.mark.asyncio
async def test_research_dashboard_reports_bundled_coverage_and_provenance():
    report = await dashboard()

    assert report["coverage"]["prelims_questions"] == 1300
    assert report["coverage"]["full_text_questions"] == 1198
    assert report["coverage"]["topic_title_only_questions"] == 100
    assert report["coverage"]["without_research_text"] == 2
    assert len(report["prelims"]["subject_by_year"]) == 13
    assert len(report["prelims"]["subtopic_recurrence"]) == 174
    assert len(report["mains"]["years"]) == 14
    assert len(report["mains"]["rows"]) == 60
    assert report["coverage"]["taxonomy_subjects"] == 23
    assert report["coverage"]["optional_subject_labels"] == ["Philosophy Optional"]
    assert report["coverage"]["full_optional_syllabus_available"] is False
    assert report["coverage"]["mains_trend_independently_verified"] is False
    assert report["coverage"]["scheduled_test_papers"] == 46
    assert report["coverage"]["schedule_is_upsc_official"] is False


@pytest.mark.asyncio
async def test_pyq_detail_only_returns_text_for_full_text_records():
    records = _text_details()
    full_id = next(question_id for question_id, row in records.items() if row["text_quality"] == "FULL_TEXT")
    title_id = next(question_id for question_id, row in records.items() if row["text_quality"] == "TOPIC_TITLE_ONLY")

    full_record = await question_detail(full_id)
    title_record = await question_detail(title_id)

    assert full_record.text_quality == "FULL_TEXT"
    assert full_record.question_text
    assert title_record.text_quality == "TOPIC_TITLE_ONLY"
    assert title_record.question_text == ""