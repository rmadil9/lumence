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
    today = date.today()

    if user.last_published_date == today:
        return StreakResponse(streak=user.streak_count, already_published_today=True)

    if user.last_published_date == today - timedelta(days=1):
        user.streak_count += 1
    else:
        user.streak_count = 1

    user.last_published_date = today
    session.add(user)
    session.commit()
    session.refresh(user)
    return StreakResponse(streak=user.streak_count, already_published_today=False)
