from datetime import date as date_type
from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, SQLModel, UniqueConstraint


class TodoStatus(str, Enum):
    TODO = "todo"
    DONE = "done"


def _utcnow() -> datetime:
    # naive UTC, to match the DateTime (no tz) column type in the migration
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    clerk_user_id: str = Field(unique=True, index=True)
    email: str
    created_at: datetime = Field(default_factory=_utcnow)
    streak_count: int = Field(default=0)
    last_published_date: date_type | None = Field(default=None)


class Todo(SQLModel, table=True):
    __tablename__ = "todos"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str
    description: str | None = None
    status: TodoStatus = Field(default=TodoStatus.TODO)
    created_at: datetime = Field(default_factory=_utcnow)
    completed_at: datetime | None = Field(default=None)


class DailyUsage(SQLModel, table=True):
    __tablename__ = "daily_usage"
    __table_args__ = (UniqueConstraint("user_id", "date"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    date: date_type = Field(default_factory=date_type.today)
    count: int = Field(default=0)


# --- request/response schemas (not tables) ---


class TodoCreate(SQLModel):
    title: str
    description: str | None = None


class TodoUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    status: TodoStatus | None = None


class ChatMessage(SQLModel):
    role: str
    content: str


class ChatRequest(SQLModel):
    messages: list[ChatMessage]


class ChatResponse(SQLModel):
    reply: str


class UsageResponse(SQLModel):
    used_today: int
    limit: int


class StreakResponse(SQLModel):
    streak: int
    already_published_today: bool
