from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.auth import get_current_user
from app.database import get_session
from app.models import StreakResponse, User

router = APIRouter()


@router.get("/streak")
def get_streak(user: User = Depends(get_current_user)) -> StreakResponse:
    return StreakResponse(
        streak=user.streak_count,
        already_published_today=user.last_published_date == date.today(),
    )


@router.post("/publish")
def mark_published(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> StreakResponse:
    # re-fetch through this session - `user` may come from a session-independent
    # instance (e.g. a dependency override in tests), so mutating it directly
    # and re-adding it risks an INSERT against an already-existing row
    db_user = session.get(User, user.id)
    today = date.today()

    if db_user.last_published_date == today:
        return StreakResponse(streak=db_user.streak_count, already_published_today=True)

    if db_user.last_published_date == today - timedelta(days=1):
        db_user.streak_count += 1
    else:
        db_user.streak_count = 1

    db_user.last_published_date = today
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return StreakResponse(streak=db_user.streak_count, already_published_today=False)
