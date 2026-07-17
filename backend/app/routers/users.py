import os

from clerk_backend_api import Clerk
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.auth import require_user
from app.database import get_session
from app.models import User

router = APIRouter()


def _fetch_email(clerk_user_id: str) -> str:
    with Clerk(bearer_auth=os.environ["CLERK_SECRET_KEY"]) as clerk:
        clerk_user = clerk.users.get(user_id=clerk_user_id)
    primary = next(
        (e for e in clerk_user.email_addresses if e.id == clerk_user.primary_email_address_id),
        clerk_user.email_addresses[0],
    )
    return primary.email_address


@router.post("/users/sync")
def sync_user(
    clerk_user_id: str = Depends(require_user),
    session: Session = Depends(get_session),
) -> User:
    user = session.exec(select(User).where(User.clerk_user_id == clerk_user_id)).first()
    if user is not None:
        return user

    user = User(clerk_user_id=clerk_user_id, email=_fetch_email(clerk_user_id))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
