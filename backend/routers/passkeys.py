"""Passwordless WebAuthn passkey registration and session authentication."""

import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlsplit

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import (
    AuthenticatorAttachment,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from lib.db import db
from models.tracker import MeOut

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "tracker_session"
SESSION_TTL = timedelta(days=30)
CHALLENGE_TTL = timedelta(minutes=5)


class PasskeyVerificationIn(BaseModel):
    challenge: str
    credential: dict[str, Any]


async def _owner_credential() -> dict[str, Any] | None:
    return await db.passkeys.find_one({"_id": "owner"})


def _request_origin(request: Request) -> tuple[str, str]:
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    host = request.headers.get("x-forwarded-host", request.url.netloc).split(",")[0].strip()
    origin = f"{scheme}://{host}"
    parsed = urlsplit(origin)
    rp_id = parsed.hostname
    if not rp_id or (scheme != "https" and rp_id not in {"localhost", "127.0.0.1"}):
        raise HTTPException(status_code=400, detail="Passkeys require this app to be served over HTTPS")
    return origin, rp_id


async def _save_challenge(challenge: bytes, purpose: str, origin: str, rp_id: str) -> str:
    encoded = bytes_to_base64url(challenge)
    now = datetime.now(timezone.utc)
    await db.passkey_challenges.insert_one(
        {
            "_id": encoded,
            "purpose": purpose,
            "origin": origin,
            "rp_id": rp_id,
            "expires_at": now + CHALLENGE_TTL,
        }
    )
    return encoded


async def _take_challenge(challenge: str, purpose: str, request: Request) -> bytes:
    record = await db.passkey_challenges.find_one_and_delete(
        {"_id": challenge, "purpose": purpose}
    )
    origin, rp_id = _request_origin(request)
    now = datetime.now(timezone.utc)
    expires_at = record.get("expires_at") if record else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if (
        not record
        or not expires_at
        or expires_at <= now
        or record["origin"] != origin
        or record["rp_id"] != rp_id
    ):
        raise HTTPException(status_code=400, detail="Passkey challenge expired. Try again.")
    try:
        return base64url_to_bytes(challenge)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid passkey challenge") from exc


async def _issue_session(response: Response, request: Request) -> None:
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    await db.passkey_sessions.insert_one(
        {
            "_id": hashlib.sha256(token.encode()).hexdigest(),
            "created_at": now,
            "expires_at": now + SESSION_TTL,
        }
    )
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        secure=scheme == "https",
        samesite="lax",
        max_age=int(SESSION_TTL.total_seconds()),
        path="/",
    )


async def require_auth(
    tracker_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> None:
    if os.environ.get("APP_LOCK_ENABLED", "false").strip().lower() not in {
        "1",
        "true",
        "yes",
        "on",
    }:
        return
    if not tracker_session:
        raise HTTPException(status_code=401, detail="Passkey authentication required")
    digest = hashlib.sha256(tracker_session.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    session = await db.passkey_sessions.find_one(
        {"_id": digest, "expires_at": {"$gt": now}}, {"_id": 1}
    )
    if not session:
        raise HTTPException(status_code=401, detail="Passkey session expired")


@router.get("/passkey/status")
async def passkey_status() -> dict[str, bool]:
    return {"registered": await _owner_credential() is not None}


@router.post("/passkey/register/options")
async def registration_options(request: Request) -> dict[str, Any]:
    if await _owner_credential():
        raise HTTPException(status_code=409, detail="A passkey is already registered")
    origin, rp_id = _request_origin(request)
    challenge = secrets.token_bytes(32)
    options = generate_registration_options(
        rp_id=rp_id,
        rp_name="UPSC Study Tracker",
        user_id=hashlib.sha256(f"upsc-owner:{rp_id}".encode()).digest(),
        user_name="upsc-owner",
        user_display_name="UPSC Study Tracker",
        challenge=challenge,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            resident_key=ResidentKeyRequirement.REQUIRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
    )
    encoded_challenge = await _save_challenge(challenge, "register", origin, rp_id)
    return {"challenge": encoded_challenge, "options": json.loads(options_to_json(options))}


@router.post("/passkey/register/verify", response_model=MeOut)
async def verify_registration(
    body: PasskeyVerificationIn, request: Request, response: Response
) -> MeOut:
    if await _owner_credential():
        raise HTTPException(status_code=409, detail="A passkey is already registered")
    challenge = await _take_challenge(body.challenge, "register", request)
    origin, rp_id = _request_origin(request)
    try:
        verified = verify_registration_response(
            credential=body.credential,
            expected_challenge=challenge,
            expected_rp_id=rp_id,
            expected_origin=origin,
            require_user_verification=True,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Passkey registration could not be verified") from exc
    try:
        await db.passkeys.insert_one(
            {
                "_id": "owner",
                "credential_id": bytes_to_base64url(verified.credential_id),
                "public_key": verified.credential_public_key,
                "sign_count": verified.sign_count,
                "device_type": verified.credential_device_type.value,
                "created_at": datetime.now(timezone.utc),
            }
        )
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="This tracker has already been claimed") from exc
    await _issue_session(response, request)
    return MeOut(authenticated=True)


@router.post("/passkey/login/options")
async def authentication_options(request: Request) -> dict[str, Any]:
    credential = await _owner_credential()
    if not credential:
        raise HTTPException(status_code=404, detail="No passkey has been registered yet")
    origin, rp_id = _request_origin(request)
    challenge = secrets.token_bytes(32)
    options = generate_authentication_options(
        rp_id=rp_id,
        challenge=challenge,
        allow_credentials=[
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(credential["credential_id"]))
        ],
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    encoded_challenge = await _save_challenge(challenge, "login", origin, rp_id)
    return {"challenge": encoded_challenge, "options": json.loads(options_to_json(options))}


@router.post("/passkey/login/verify", response_model=MeOut)
async def verify_authentication(
    body: PasskeyVerificationIn, request: Request, response: Response
) -> MeOut:
    credential = await _owner_credential()
    if not credential:
        raise HTTPException(status_code=404, detail="No passkey has been registered yet")
    try:
        presented_id = bytes_to_base64url(base64url_to_bytes(str(body.credential["rawId"])))
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid passkey response") from exc
    if presented_id != credential["credential_id"]:
        raise HTTPException(status_code=401, detail="This passkey is not registered")
    challenge = await _take_challenge(body.challenge, "login", request)
    origin, rp_id = _request_origin(request)
    try:
        verified = verify_authentication_response(
            credential=body.credential,
            expected_challenge=challenge,
            expected_rp_id=rp_id,
            expected_origin=origin,
            credential_public_key=bytes(credential["public_key"]),
            credential_current_sign_count=credential["sign_count"],
            require_user_verification=True,
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Passkey verification failed") from exc
    await db.passkeys.update_one(
        {"_id": "owner", "credential_id": presented_id},
        {"$set": {"sign_count": verified.new_sign_count}},
    )
    await _issue_session(response, request)
    return MeOut(authenticated=True)


@router.get("/me", response_model=MeOut)
async def me(_: None = Depends(require_auth)) -> MeOut:
    return MeOut(authenticated=True)


@router.post("/logout")
async def logout(
    response: Response,
    tracker_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> dict[str, bool]:
    if tracker_session:
        digest = hashlib.sha256(tracker_session.encode()).hexdigest()
        await db.passkey_sessions.delete_one({"_id": digest})
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}
