import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.auth import get_current_user
from app.database import get_session
from app.main import app
from app.models import User


@pytest.fixture
def engine():
    test_engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(test_engine)
    return test_engine


@pytest.fixture
def test_user(engine):
    with Session(engine) as session:
        user = User(clerk_user_id="test_clerk_id", email="test@example.com")
        session.add(user)
        session.commit()
        session.refresh(user)
        user_id = user.id
    # fresh, session-independent instance - avoids detached-instance surprises
    return User(id=user_id, clerk_user_id="test_clerk_id", email="test@example.com")


@pytest.fixture
def client(engine, test_user):
    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = lambda: test_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
