import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "contractiq.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate():
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(contracts)")
        existing = {row[1] for row in cur.fetchall()}
        columns = {
            "reference_number": "TEXT DEFAULT ''",
            "provider_name": "TEXT DEFAULT ''",
            "provider_email": "TEXT DEFAULT ''",
            "customer_name": "TEXT DEFAULT ''",
            "customer_email": "TEXT DEFAULT ''",
            "additional_parties": "TEXT DEFAULT ''",
            "payment_terms": "TEXT DEFAULT ''",
            "payment_frequency": "TEXT DEFAULT ''",
            "auto_renewal": "TEXT DEFAULT 'No'",
            "renewal_period": "TEXT DEFAULT ''",
            "renewal_notice_period": "TEXT DEFAULT ''",
            "termination_notice_period": "TEXT DEFAULT ''",
            "summary": "TEXT DEFAULT ''",
            "governing_law": "TEXT DEFAULT ''",
            "sla_uptime": "TEXT DEFAULT ''",
            "key_terms": "TEXT DEFAULT ''",
            "compliance_requirements": "TEXT DEFAULT ''",
        }
        for name, decl in columns.items():
            if name not in existing:
                cur.execute(f"ALTER TABLE contracts ADD COLUMN {name} {decl}")
        conn.commit()
        conn.close()
    except Exception:
        pass
