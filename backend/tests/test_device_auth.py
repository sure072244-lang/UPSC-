import os
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from starlette.requests import Request

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "upsc_test")

from routers import passkeys as auth


def request_for_app() -> Request:
    return Request(
        {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "POST",
            "scheme": "https",
            "path": "/api/auth/passkey/register/options",
            "raw_path": b"/api/auth/passkey/register/options",
            "query_string": b"",
            "headers": [
                (b"host", b"tracker.example"),
                (b"x-forwarded-proto", b"https"),
                (b"x-forwarded-host", b"tracker.example"),
            ],
            "client": ("127.0.0.1", 12345),
            "server": ("tracker.example", 443),
        }
    )


@pytest.mark.asyncio
async def test_status_reports_when_first_passkey_is_needed(monkeypatch):
    passkeys = SimpleNamespace(find_one=AsyncMock(return_value=None))
    monkeypatch.setattr(auth, "db", SimpleNamespace(passkeys=passkeys))

    assert await auth.passkey_status() == {"registered": False}


@pytest.mark.asyncio
async def test_registration_options_require_a_platform_passkey(monkeypatch):
    passkeys = SimpleNamespace(find_one=AsyncMock(return_value=None))
    challenges = SimpleNamespace(insert_one=AsyncMock())
    monkeypatch.setattr(
        auth, "db", SimpleNamespace(passkeys=passkeys, passkey_challenges=challenges)
    )

    result = await auth.registration_options(request_for_app())

    assert result["challenge"]
    assert result["options"]["authenticatorSelection"]["authenticatorAttachment"] == "platform"
    assert result["options"]["authenticatorSelection"]["userVerification"] == "required"
    challenges.insert_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_registration_options_close_after_first_claim(monkeypatch):
    passkeys = SimpleNamespace(find_one=AsyncMock(return_value={"_id": "owner"}))
    monkeypatch.setattr(auth, "db", SimpleNamespace(passkeys=passkeys))

    with pytest.raises(HTTPException) as error:
        await auth.registration_options(request_for_app())

    assert error.value.status_code == 409


@pytest.mark.asyncio
async def test_auth_guard_rejects_missing_or_expired_session(monkeypatch):
    monkeypatch.setenv("APP_LOCK_ENABLED", "true")
    sessions = SimpleNamespace(find_one=AsyncMock(return_value=None))
    monkeypatch.setattr(auth, "db", SimpleNamespace(passkey_sessions=sessions))

    with pytest.raises(HTTPException) as error:
        await auth.require_auth(tracker_session=None)

    assert error.value.status_code == 401


@pytest.mark.asyncio
async def test_auth_guard_accepts_an_active_passkey_session(monkeypatch):
    monkeypatch.setenv("APP_LOCK_ENABLED", "true")
    sessions = SimpleNamespace(find_one=AsyncMock(return_value={"_id": "session"}))
    monkeypatch.setattr(auth, "db", SimpleNamespace(passkey_sessions=sessions))

    await auth.require_auth(tracker_session="opaque-session-token")

    query = sessions.find_one.await_args.args[0]
    assert query["_id"] == auth.hashlib.sha256(b"opaque-session-token").hexdigest()
    assert query["expires_at"]["$gt"] <= datetime.now(timezone.utc) + timedelta(seconds=1)


@pytest.mark.asyncio
async def test_auth_guard_allows_data_apis_when_applock_is_disabled(monkeypatch):
    monkeypatch.setenv("APP_LOCK_ENABLED", "false")
    sessions = SimpleNamespace(find_one=AsyncMock())
    monkeypatch.setattr(auth, "db", SimpleNamespace(passkey_sessions=sessions))

    await auth.require_auth(tracker_session=None)

    sessions.find_one.assert_not_awaited()