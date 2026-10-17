import base64
import hashlib
import hmac
import json
import os
import secrets
import smtplib
import ssl
import time
from typing import Any, Callable
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, field_validator

from .common import now
from .store import PersistentList

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)
roles = {
    "Administrator",
    "Legal Manager",
    "Compliance Officer",
    "Contract Manager",
    "Department Head",
    "Employee",
}
users: PersistentList = PersistentList("users")
reset_tokens: PersistentList = PersistentList("password_reset_tokens")
_secret = os.getenv("CONTRACTIQ_JWT_SECRET", "").encode()


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=120)
    email: str
    password: str = Field(min_length=12, max_length=256)
    bootstrap_token: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.rsplit("@", 1)[-1]:
            raise ValueError("must be a valid email address")
        return value


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class RoleUpdate(BaseModel):
    role: str


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    password: str = Field(min_length=12, max_length=256)


def _jwt_secret() -> bytes:
    if _secret:
        return _secret
    raise HTTPException(status_code=503, detail="Authentication is not configured")


def _encode_token(user: dict[str, Any]) -> str:
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b"=")
    payload = base64.urlsafe_b64encode(
        json.dumps({"sub": user["id"], "role": user["role"], "exp": int(time.time()) + 3600}).encode()
    ).rstrip(b"=")
    signing_input = header + b"." + payload
    signature = hmac.new(_jwt_secret(), signing_input, hashlib.sha256).digest()
    return (signing_input + b"." + base64.urlsafe_b64encode(signature).rstrip(b"=")).decode()


def _decode_token(token: str) -> dict[str, Any]:
    try:
        header, payload, signature = token.encode().split(b".")
        signing_input = header + b"." + payload
        expected = hmac.new(_jwt_secret(), signing_input, hashlib.sha256).digest()
        actual = base64.urlsafe_b64decode(signature + b"=" * (-len(signature) % 4))
        if not hmac.compare_digest(expected, actual):
            raise ValueError("invalid signature")
        claims = json.loads(base64.urlsafe_b64decode(payload + b"=" * (-len(payload) % 4)))
        if claims["exp"] <= time.time():
            raise ValueError("expired token")
        return claims
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=401, detail="Invalid or expired bearer token") from error


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Bearer token required", headers={"WWW-Authenticate": "Bearer"})
    claims = _decode_token(credentials.credentials)
    user = next((item for item in users if item["id"] == claims.get("sub") and item["active"]), None)
    if user is None:
        raise HTTPException(status_code=401, detail="User is unavailable")
    return user


def require_roles(*allowed: str) -> Callable[..., dict[str, Any]]:
    def dependency(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
        if user["role"] not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user

    return dependency


def _public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in user.items() if key not in {"password_hash", "password_salt"}}


def _hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return base64.b64encode(digest).decode(), base64.b64encode(salt).decode()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> dict[str, Any]:
    _jwt_secret()
    email = str(payload.email).lower()
    if any(user["email"] == email for user in users):
        raise HTTPException(status_code=409, detail="Email is already registered")
    is_first_user = not users
    expected_bootstrap = os.getenv("CONTRACTIQ_BOOTSTRAP_TOKEN", "")
    if is_first_user and (not expected_bootstrap or not hmac.compare_digest(payload.bootstrap_token or "", expected_bootstrap)):
        raise HTTPException(status_code=403, detail="A valid administrator bootstrap token is required")
    password_hash, password_salt = _hash_password(payload.password)
    user = {
        "id": secrets.token_hex(16),
        "name": payload.name.strip(),
        "email": email,
        "role": "Administrator" if is_first_user else "Employee",
        "active": True,
        "password_hash": password_hash,
        "password_salt": password_salt,
        "createdAt": now(),
    }
    users.append(user)
    return _public_user(user)


@router.post("/login")
def login(payload: LoginRequest) -> dict[str, Any]:
    email = str(payload.email).lower()
    user = next((item for item in users if item["email"] == email and item["active"]), None)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _jwt_secret()
    password_hash, _ = _hash_password(payload.password, base64.b64decode(user["password_salt"]))
    if not hmac.compare_digest(password_hash, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": _encode_token(user), "token_type": "bearer", "user": _public_user(user)}


@router.get("/me")
def profile(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    return _public_user(user)


@router.patch("/me")
def update_profile(payload: ProfileUpdate, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    index = next(index for index, item in enumerate(users) if item["id"] == user["id"])
    updated = {**user, "name": payload.name.strip(), "updatedAt": now()}
    users[index] = updated
    return _public_user(updated)


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(payload: PasswordResetRequest) -> dict[str, str]:
    generic_response = {"message": "If the account exists, password reset instructions have been sent."}
    email = payload.email.strip().lower()
    user = next((item for item in users if item["email"] == email and item["active"]), None)
    smtp_host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM")
    if user is None or not smtp_host or not sender:
        return generic_response
    token = secrets.token_urlsafe(32)
    reset_tokens[:] = [entry for entry in reset_tokens if entry["userId"] != user["id"]]
    reset_tokens.append({
        "userId": user["id"],
        "tokenHash": hashlib.sha256(token.encode()).hexdigest(),
        "expiresAt": int(time.time()) + 900,
    })
    message = EmailMessage()
    message["Subject"] = "ContractIQ password reset"
    message["From"] = sender
    message["To"] = user["email"]
    message.set_content(f"Use this one-time password reset token within 15 minutes: {token}")
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        with smtplib.SMTP(smtp_host, port, timeout=10) as client:
            client.starttls(context=ssl.create_default_context())
            username = os.getenv("SMTP_USERNAME")
            password = os.getenv("SMTP_PASSWORD")
            if username and password:
                client.login(username, password)
            client.send_message(message)
    except (OSError, smtplib.SMTPException, ValueError) as error:
        reset_tokens[:] = [entry for entry in reset_tokens if entry["userId"] != user["id"]]
        raise HTTPException(status_code=503, detail="Password reset email could not be sent") from error
    return generic_response


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm) -> dict[str, str]:
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    for index, reset in enumerate(reset_tokens):
        if reset["expiresAt"] <= int(time.time()):
            reset_tokens.pop(index)
            continue
        if not hmac.compare_digest(token_hash, reset["tokenHash"]):
            continue
        user_index = next((i for i, item in enumerate(users) if item["id"] == reset["userId"]), None)
        if user_index is None:
            reset_tokens.pop(index)
            raise HTTPException(status_code=400, detail="Reset token is invalid or expired")
        password_hash, password_salt = _hash_password(payload.password)
        users[user_index] = {**users[user_index], "password_hash": password_hash, "password_salt": password_salt, "updatedAt": now()}
        reset_tokens.pop(index)
        return {"message": "Password has been reset"}
    raise HTTPException(status_code=400, detail="Reset token is invalid or expired")


@router.get("/users")
def list_users(user: dict[str, Any] = Depends(require_roles("Administrator"))) -> dict[str, Any]:
    return {"data": [_public_user(item) for item in users], "total": len(users)}


@router.patch("/users/{user_id}/role")
def update_role(user_id: str, payload: RoleUpdate, _: dict[str, Any] = Depends(require_roles("Administrator"))) -> dict[str, Any]:
    if payload.role not in roles:
        raise HTTPException(status_code=422, detail={"role": "Invalid role"})
    for index, user in enumerate(users):
        if user["id"] == user_id:
            updated = {**user, "role": payload.role, "updatedAt": now()}
            users[index] = updated
            return _public_user(updated)
    raise HTTPException(status_code=404, detail="User not found")