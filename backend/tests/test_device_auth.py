import os
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "upsc_test")

from routers import auth


@pytest.fixture(autouse=True)
def app_secret(monkeypatch):
    monkeypatch.setenv("APP_SECRET", "test-secret-that-is-at-least-32-chars")


def test_unlock_requires_a_device_identity():
    with pytest.raises(ValidationError):
        auth.UnlockIn.model_validate({"pin": "1234", "device_id": "short"})


@pytest.mark.asyncio
async def test_session_rejects_a_different_device():
    token = auth.create_token("redmi-pad-browser")

    with pytest.raises(HTTPException) as error:
        await auth.require_auth(token, "another-browser")

    assert error.value.status_code == 401


@pytest.mark.asyncio
async def test_session_requires_an_approved_device(monkeypatch):
    token = auth.create_token("redmi-pad-browser")
    devices = SimpleNamespace(find_one=AsyncMock(return_value=None))
    monkeypatch.setattr(auth, "db", SimpleNamespace(devices=devices))

    with pytest.raises(HTTPException) as error:
        await auth.require_auth(token, "redmi-pad-browser")

    assert error.value.status_code == 401


@pytest.mark.asyncio
async def test_session_accepts_the_matching_approved_device(monkeypatch):
    token = auth.create_token("redmi-pad-browser")
    devices = SimpleNamespace(find_one=AsyncMock(return_value={"_id": "device"}))
    monkeypatch.setattr(auth, "db", SimpleNamespace(devices=devices))

    await auth.require_auth(token, "redmi-pad-browser")

    devices.find_one.assert_awaited_once_with(
        {"id": "redmi-pad-browser", "approved": True}, {"_id": 1}
    )