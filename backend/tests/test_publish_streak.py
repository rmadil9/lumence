from datetime import date, timedelta

from sqlmodel import Session

from app.models import User


def test_first_publish_starts_streak_at_one(client):
    resp = client.get("/streak")
    assert resp.json() == {"streak": 0, "already_published_today": False}

    resp = client.post("/publish")
    assert resp.json() == {"streak": 1, "already_published_today": False}


def test_publishing_again_same_day_does_not_advance_streak(client):
    client.post("/publish")
    resp = client.post("/publish")
    assert resp.json() == {"streak": 1, "already_published_today": True}


def test_publishing_on_consecutive_day_advances_streak(client, engine, test_user):
    client.post("/publish")

    with Session(engine) as session:
        user = session.get(User, test_user.id)
        user.last_published_date = date.today() - timedelta(days=1)
        session.add(user)
        session.commit()

    resp = client.post("/publish")
    assert resp.json() == {"streak": 2, "already_published_today": False}


def test_publishing_after_a_gap_resets_streak_to_one(client, engine, test_user):
    client.post("/publish")

    with Session(engine) as session:
        user = session.get(User, test_user.id)
        user.streak_count = 5
        user.last_published_date = date.today() - timedelta(days=3)
        session.add(user)
        session.commit()

    resp = client.post("/publish")
    assert resp.json() == {"streak": 1, "already_published_today": False}
