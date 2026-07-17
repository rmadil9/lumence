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
