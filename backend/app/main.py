from fastapi import FastAPI

app = FastAPI(title="Build-in-Public Companion API")


@app.get("/")
def read_root():
    return {"status": "ok", "service": "backend"}
