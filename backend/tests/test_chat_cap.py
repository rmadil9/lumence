import pytest

from app.routers import chat as chat_module


class _FakeMessage:
    content = "fake reply"


class _FakeChoice:
    message = _FakeMessage()


class _FakeResponse:
    choices = [_FakeChoice()]


@pytest.fixture(autouse=True)
def fake_openai(monkeypatch):
    monkeypatch.setattr(
        chat_module.client.chat.completions, "create", lambda *a, **kw: _FakeResponse()
    )


def test_chat_enforces_daily_cap(client, monkeypatch):
    monkeypatch.setattr(chat_module, "DAILY_CHAT_LIMIT", 2)
    payload = {"messages": [{"role": "user", "content": "polish this"}]}

    resp1 = client.post("/chat", json=payload)
    assert resp1.status_code == 200
    assert resp1.json() == {"reply": "fake reply"}

    resp2 = client.post("/chat", json=payload)
    assert resp2.status_code == 200

    resp3 = client.post("/chat", json=payload)
    assert resp3.status_code == 429

    usage = client.get("/usage").json()
    assert usage == {"used_today": 2, "limit": 2}


def test_failed_openai_call_does_not_count_against_cap(client, monkeypatch):
    monkeypatch.setattr(chat_module, "DAILY_CHAT_LIMIT", 5)

    def _boom(*a, **kw):
        raise RuntimeError("upstream down")

    monkeypatch.setattr(chat_module.client.chat.completions, "create", _boom)

    payload = {"messages": [{"role": "user", "content": "hi"}]}
    resp = client.post("/chat", json=payload)
    assert resp.status_code == 502

    usage = client.get("/usage").json()
    assert usage["used_today"] == 0
