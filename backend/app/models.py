from datetime import date, datetime
from enum import Enum

from sqlmodel import Field, SQLModel, UniqueConstraint


class TodoStatus(str, Enum):
    TODO = "todo"
    DONE = "done"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    clerk_user_id: str = Field(unique=True, index=True)
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Todo(SQLModel, table=True):
    __tablename__ = "todos"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str
    description: str | None = None
    status: TodoStatus = Field(default=TodoStatus.TODO)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DailyUsage(SQLModel, table=True):
    __tablename__ = "daily_usage"
    __table_args__ = (UniqueConstraint("user_id", "date"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    date: date = Field(default_factory=date.today)
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
    notepad_text: str
    messages: list[ChatMessage]


class ChatResponse(SQLModel):
    reply: str


class UsageResponse(SQLModel):
    used_today: int
    limit: int
