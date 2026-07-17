from fastapi import FastAPI, HTTPException

from app.database import ping_db

app = FastAPI(title="Build-in-Public Companion API")


@app.get("/")
def read_root():
    return {"status": "ok", "service": "backend"}


@app.get("/health/db")
def health_db():
    try:
        ping_db()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="database unreachable") from exc
    return {"status": "ok", "service": "database"}
