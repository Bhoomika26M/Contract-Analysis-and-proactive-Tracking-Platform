import os, urllib.parse, urllib.request, json, secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

OAUTH_STATE = {}

PROVIDERS = {
    "google": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://openidconnect.googleapis.com/v1/userinfo",
        "scope": "openid email profile",
    },
    "microsoft": {
        "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        "userinfo_url": "https://graph.microsoft.com/oidc/userinfo",
        "scope": "openid email profile",
    },
}

def okta_config():
    domain = os.getenv("OKTA_DOMAIN", "").rstrip("/")
    return {
        "auth_url": f"{domain}/oauth2/default/v1/authorize",
        "token_url": f"{domain}/oauth2/default/v1/token",
        "userinfo_url": f"{domain}/oauth2/default/v1/userinfo",
        "scope": "openid email profile",
    }

def provider_config(provider):
    if provider == "okta":
        return okta_config()
    return PROVIDERS.get(provider)

def client_creds(provider):
    if provider == "google":
        return os.getenv("GOOGLE_CLIENT_ID"), os.getenv("GOOGLE_CLIENT_SECRET")
    if provider == "microsoft":
        return os.getenv("MICROSOFT_CLIENT_ID"), os.getenv("MICROSOFT_CLIENT_SECRET")
    if provider == "okta":
        return os.getenv("OKTA_CLIENT_ID"), os.getenv("OKTA_CLIENT_SECRET")
    return None, None


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    avatar = payload.avatar or (payload.name[:2].upper() if payload.name else "")
    user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        organization=payload.organization or "",
        department=payload.department or "",
        avatar=avatar,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/providers")
def providers():
    def configured(provider):
        cid, csecret = client_creds(provider)
        cfg = provider_config(provider)
        return bool(cid and csecret and cfg and cfg.get("auth_url"))
    return {
        "google": configured("google"),
        "microsoft": configured("microsoft"),
        "okta": configured("okta"),
    }


import smtplib
import ssl
import hashlib
import secrets
import logging
from email.message import EmailMessage
from datetime import datetime, timedelta

logger = logging.getLogger("uvicorn.error")

RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _smtp_config():
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    sender = os.getenv("SMTP_FROM", user or "no-reply@contractiq.com")
    frontend = os.getenv("FRONTEND_URL", "http://localhost:8443")
    missing = []
    if not host:
        missing.append("SMTP_HOST")
    if not sender:
        missing.append("SMTP_FROM (or SMTP_USER)")
    if not frontend:
        missing.append("FRONTEND_URL")
    return host, port, user, password, sender, frontend, missing


def _send_reset_email(to_email: str, link: str):
    host, port, user, password, sender, frontend, missing = _smtp_config()
    if missing:
        raise HTTPException(
            status_code=503,
            detail="Email is not configured. Missing environment variables: " + ", ".join(missing)
            + ". Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM and FRONTEND_URL.",
        )
    msg = EmailMessage()
    msg["Subject"] = "ContractIQ password reset"
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(
        f"Reset your password using this link: {link}\n"
        f"This link expires in {RESET_TOKEN_EXPIRE_MINUTES} minutes.\n"
        "If you did not request this, you can ignore this email."
    )
    try:
        if port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, timeout=30, context=context) as server:
                server.ehlo()
                if user and password:
                    server.login(user, password)
                server.send_message(msg)
        else:
            context = ssl.create_default_context()
            with smtplib.SMTP(host, port, timeout=30) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                if user and password:
                    server.login(user, password)
                server.send_message(msg)
    except smtplib.SMTPAuthenticationError as e:
        logger.exception("SMTP authentication failed")
        raise HTTPException(status_code=500, detail=f"SMTP authentication failed: {e}")
    except smtplib.SMTPException as e:
        logger.exception("SMTP send failed")
        raise HTTPException(status_code=500, detail=f"Email send failed: {e}")
    except Exception as e:
        logger.exception("Email send failed")
        raise HTTPException(status_code=500, detail=f"Email send failed: {e}")


@router.post("/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Validate email configuration up front so callers get a clear, actionable error.
    host, port, user, password, sender, frontend, missing = _smtp_config()
    if missing:
        raise HTTPException(
            status_code=503,
            detail="Email is not configured. Missing environment variables: " + ", ".join(missing)
            + ". Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM and FRONTEND_URL.",
        )
    email = payload.email
    user = db.query(models.User).filter(models.User.email == email).first()
    # Always respond generically to avoid account enumeration.
    if user and user.is_active:
        # Invalidate any previous unused tokens for this user.
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.user_id == user.id,
            models.PasswordResetToken.used == False,
        ).update({"used": True})
        raw_token = secrets.token_urlsafe(32)
        token_row = models.PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(raw_token),
            expires_at=datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
        )
        db.add(token_row)
        db.commit()
        frontend = os.getenv("FRONTEND_URL", "http://localhost:8443")
        link = f"{frontend}/?reset_token={raw_token}"
        _send_reset_email(user.email, link)
    return {"message": "If the account exists, reset instructions have been sent to the email address."}


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    token = payload.token
    new_password = payload.new_password
    if payload.confirm_password is not None and payload.confirm_password != new_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    token_hash = _hash_token(token)
    row = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token_hash == token_hash
    ).first()
    if not row or row.used:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if row.expires_at < datetime.utcnow():
        row.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(models.User).filter(models.User.id == row.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(new_password)
    row.used = True
    db.commit()
    return {"message": "Password reset successful. You can now log in."}


@router.get("/oauth/{provider}")
def oauth_start(provider: str):
    if provider not in ("google", "microsoft", "okta"):
        raise HTTPException(404, "Unknown provider")
    cfg = provider_config(provider)
    cid, _ = client_creds(provider)
    if not cid or not cfg or not cfg.get("auth_url"):
        raise HTTPException(503, "OAuth provider not configured")
    state = secrets.token_urlsafe(16)
    OAUTH_STATE[state] = provider
    redirect_uri = os.getenv("OAUTH_REDIRECT_URI", f"http://localhost:8000/api/auth/oauth/{provider}/callback")
    params = {
        "client_id": cid,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": cfg["scope"],
        "state": state,
    }
    return RedirectResponse(url=cfg["auth_url"] + "?" + urllib.parse.urlencode(params))


@router.get("/oauth/{provider}/callback")
def oauth_callback(provider: str, code: str = None, state: str = None, db: Session = Depends(get_db)):
    if provider not in ("google", "microsoft", "okta"):
        raise HTTPException(404, "Unknown provider")
    if not code or state not in OAUTH_STATE or OAUTH_STATE.pop(state) != provider:
        raise HTTPException(400, "Invalid OAuth state")
    cfg = provider_config(provider)
    cid, csecret = client_creds(provider)
    redirect_uri = os.getenv("OAUTH_REDIRECT_URI", f"http://localhost:8000/api/auth/oauth/{provider}/callback")
    data = urllib.parse.urlencode({
        "client_id": cid,
        "client_secret": csecret,
        "code": code,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }).encode()
    req = urllib.request.Request(cfg["token_url"], data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req) as resp:
            token_data = json.loads(resp.read().decode())
    except Exception as e:
        raise HTTPException(400, f"Token exchange failed: {e}")
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(400, "No access token")
    ureq = urllib.request.Request(cfg["userinfo_url"])
    ureq.add_header("Authorization", f"Bearer {access_token}")
    try:
        with urllib.request.urlopen(ureq) as resp:
            userinfo = json.loads(resp.read().decode())
    except Exception as e:
        raise HTTPException(400, f"Userinfo failed: {e}")
    email = userinfo.get("email")
    name = userinfo.get("name") or userinfo.get("given_name") or (email.split("@")[0] if email else "User")
    if not email:
        raise HTTPException(400, "No email from provider")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            name=name,
            role="employee",
            avatar=name[:2].upper(),
            organization="",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    frontend = os.getenv("FRONTEND_URL", "http://localhost:8443")
    return RedirectResponse(url=f"{frontend}/?token={token}")
