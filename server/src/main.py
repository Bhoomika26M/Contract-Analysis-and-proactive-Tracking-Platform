from fastapi import FastAPI

app = FastAPI(title="ContractIQ API")

@app.get("/")
def read_root():
    return {"message": "FastAPI backend is running"}