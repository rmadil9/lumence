from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Todo, TodoCreate, TodoUpdate, User

router = APIRouter()


@router.get("/todos")
def list_todos(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[Todo]:
    return session.exec(select(Todo).where(Todo.user_id == user.id)).all()


@router.post("/todos")
def create_todo(
    payload: TodoCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Todo:
    todo = Todo(user_id=user.id, **payload.model_dump())
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


def _get_owned_todo(todo_id: int, user: User, session: Session) -> Todo:
    todo = session.get(Todo, todo_id)
    if todo is None or todo.user_id != user.id:
        # 404, not 403 - don't reveal that a todo ID belongs to someone else
        raise HTTPException(status_code=404, detail="todo not found")
    return todo


@router.patch("/todos/{todo_id}")
def update_todo(
    todo_id: int,
    payload: TodoUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Todo:
    todo = _get_owned_todo(todo_id, user, session)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.delete("/todos/{todo_id}", status_code=204)
def delete_todo(
    todo_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    todo = _get_owned_todo(todo_id, user, session)
    session.delete(todo)
    session.commit()
