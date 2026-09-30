import os

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "upsc_diagnostics_test")

from server import data_diagnostics


@pytest.mark.asyncio
async def test_data_diagnostics_reports_bundled_questions_and_sources():
    report = await data_diagnostics()

    assert report["pyq_available"] is True
    assert report["pyq_rows"] == 1300
    assert report["source_rows"] == 1300
    assert report["question_text_rows"] == 1300
    assert report["official_paper_rows"] == 1300
    assert isinstance(report["mongo_configured"], bool)
    assert isinstance(report["notion_configured"], bool)