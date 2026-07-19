import os
from datetime import date

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import ChatRequest, ChatResponse, DailyUsage, UsageResponse, User

load_dotenv()

router = APIRouter()

DAILY_CHAT_LIMIT = int(os.environ["DAILY_CHAT_LIMIT"])

SYSTEM_PROMPT = (
    "You are a writing assistant helping a developer polish a build-in-public post "
    "about what they worked on today. Be concise and keep their voice."
)

client = OpenAI()


def _get_or_create_usage(user_id: int, session: Session) -> DailyUsage:
    today = date.today()
    usage = session.exec(
        select(DailyUsage).where(DailyUsage.user_id == user_id, DailyUsage.date == today)
    ).first()
    if usage is None:
        usage = DailyUsage(user_id=user_id, date=today, count=0)
        session.add(usage)
        session.commit()
        session.refresh(usage)
    return usage


@router.get("/usage")
def get_usage(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UsageResponse:
    usage = _get_or_create_usage(user.id, session)
    return UsageResponse(used_today=usage.count, limit=DAILY_CHAT_LIMIT)


@router.post("/chat")
def chat(
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ChatResponse:
    usage = _get_or_create_usage(user.id, session)
    if usage.count >= DAILY_CHAT_LIMIT:
        raise HTTPException(status_code=429, detail="daily chat limit reached")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *[{"role": m.role, "content": m.content} for m in payload.messages],
    ]
    try:
        response = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI service unavailable") from exc

    # only counts against the cap on success - a failed call shouldn't cost the user a turn
    usage.count += 1
    session.add(usage)
    session.commit()

    return ChatResponse(reply=response.choices[0].message.content)
