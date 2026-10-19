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
from email.message import EmailMessage

@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    user = db.query(models.User).filter(models.User.email == email).first() if email else None
    if not user:
        return {"message": "If the account exists, reset instructions have been sent."}
    reset_token = create_access_token({"sub": str(user.id), "purpose": "password_reset"})
    frontend = os.getenv("FRONTEND_URL", "http://localhost:8443")
    link = f"{frontend}/?reset_token={reset_token}"
    smtp_host = os.getenv("SMTP_HOST")
    if smtp_host:
        try:
            msg = EmailMessage()
            msg["Subject"] = "ContractIQ password reset"
            msg["From"] = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@contractiq.com"))
            msg["To"] = user.email
            msg.set_content(f"Reset your password using this link: {link}\nThis link expires in 24 hours.")
            with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", "587"))) as server:
                server.starttls()
                su, sp = os.getenv("SMTP_USER"), os.getenv("SMTP_PASS")
                if su and sp:
                    server.login(su, sp)
                server.send_message(msg)
            return {"message": "Reset link sent to email."}
        except Exception as e:
            raise HTTPException(500, f"Email send failed: {e}")
    return {"message": "SMTP not configured; use reset link.", "reset_link": link, "reset_token": reset_token}


@router.post("/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    token = payload.get("token")
    new_password = payload.get("new_password")
    if not token or not new_password or len(new_password) < 6:
        raise HTTPException(400, "Invalid request")
    try:
        from jose import jwt
        data = jwt.decode(token, os.getenv("SECRET_KEY", "change-me-in-production-contractiq-secret"), algorithms=["HS256"])
        if data.get("purpose") != "password_reset":
            raise ValueError("bad purpose")
        user_id = data.get("sub")
    except Exception:
        raise HTTPException(400, "Invalid or expired token")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.password_hash = hash_password(new_password)
    db.commit()
    return {"message": "Password reset successful."}


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
