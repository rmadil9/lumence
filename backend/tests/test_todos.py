def test_create_list_update_delete_todo(client):
    resp = client.post("/todos", json={"title": "write post", "description": "draft"})
    assert resp.status_code == 200
    todo = resp.json()
    assert todo["title"] == "write post"
    assert todo["status"] == "todo"

    resp = client.get("/todos")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = client.patch(f"/todos/{todo['id']}", json={"status": "done"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "done"

    resp = client.delete(f"/todos/{todo['id']}")
    assert resp.status_code == 204

    resp = client.get("/todos")
    assert resp.json() == []


def test_patch_nonexistent_todo_returns_404(client):
    resp = client.patch("/todos/9999", json={"title": "x"})
    assert resp.status_code == 404


def test_delete_nonexistent_todo_returns_404(client):
    resp = client.delete("/todos/9999")
    assert resp.status_code == 404


def test_marking_done_stamps_completed_at_and_reverting_clears_it(client):
    todo = client.post("/todos", json={"title": "write post"}).json()

    resp = client.patch(f"/todos/{todo['id']}", json={"status": "done"})
    assert resp.json()["completed_at"] is not None

    resp = client.patch(f"/todos/{todo['id']}", json={"status": "todo"})
    assert resp.json()["completed_at"] is None


def test_done_todo_completed_before_today_is_cleared_on_list(client, engine):
    from datetime import datetime, timedelta

    from sqlmodel import Session

    from app.models import Todo, TodoStatus

    todo = client.post("/todos", json={"title": "old done task"}).json()

    yesterday = datetime.utcnow() - timedelta(days=1)
    with Session(engine) as session:
        db_todo = session.get(Todo, todo["id"])
        db_todo.status = TodoStatus.DONE
        db_todo.completed_at = yesterday
        session.add(db_todo)
        session.commit()

    resp = client.get("/todos")
    assert resp.json() == []


def test_done_todo_completed_today_stays_on_list(client):
    todo = client.post("/todos", json={"title": "task"}).json()
    client.patch(f"/todos/{todo['id']}", json={"status": "done"})

    resp = client.get("/todos")
    assert len(resp.json()) == 1
    assert resp.json()[0]["status"] == "done"
