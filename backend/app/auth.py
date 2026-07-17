import os

from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from fastapi import Depends, HTTPException, Request
from sqlmodel import Session, select

from app.database import get_session
from app.models import User


def require_user(request: Request) -> str:
    state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=os.environ["CLERK_SECRET_KEY"],
            jwt_key=os.environ.get("CLERK_JWT_KEY"),
            authorized_parties=os.environ["CLERK_AUTHORIZED_PARTIES"].split(","),
            accepts_token=["session_token"],
        ),
    )
    if not state.is_signed_in:
        raise HTTPException(status_code=401, detail="unauthorized")
    return state.payload["sub"]


def get_current_user(
    clerk_user_id: str = Depends(require_user),
    session: Session = Depends(get_session),
) -> User:
    user = session.exec(select(User).where(User.clerk_user_id == clerk_user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="user not synced, call /users/sync first")
    return user
