from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database.core import engine, Base
import src.auth.models
from src.auth.controller import router as auth_router
import src.contracts.models
from src.contracts.controller import router as contracts_router
from src.obligations.controller import router as obligations_router
from src.users.controller import router as users_router
import src.audit.models
from src.audit.controller import router as audit_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ContractIQ API")
app.include_router(obligations_router)

# Allow React to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(contracts_router)
app.include_router(users_router)
app.include_router(audit_router)

@app.get("/")
def read_root():
    return {"message": "FastAPI backend is running"}