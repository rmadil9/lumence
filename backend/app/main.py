import logging
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import ping_db
from app.routers import chat, publish, todos, users

logger = logging.getLogger("app")

app = FastAPI(title="Build-in-Public Companion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(todos.router)
app.include_router(chat.router)
app.include_router(publish.router)


def _error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"message": message}})


@app.exception_handler(HTTPException)
async def handle_http_exception(request: Request, exc: HTTPException):
    return _error_response(exc.status_code, str(exc.detail))


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    return _error_response(422, "invalid request")


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    # never leak raw exception text to the client - full detail goes to the log only
    logger.exception("unhandled error")
    return _error_response(500, "internal server error")


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
