import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pytest
from app import app, init_db

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    app.config.update(TESTING=True, DATABASE=str(tmp_path / 'test.sqlite3'), SECRET_KEY='test-secret')
    init_db()
    with app.test_client() as c:
        yield c

def headers(c):
    return {'X-CSRF-Token': c.get('/api/state').json['csrf']}

def test_home(client):
    assert client.get('/').status_code == 200
    assert b'SAMPLE PORTFOLIO' in client.get('/').data

def test_chat_and_clear(client):
    h = headers(client)
    response = client.post('/api/chat', json={'message':'Can I return my item?'}, headers=h)
    assert response.status_code == 200
    assert response.json['sources'][0]['id'] == 'KB-01'
    assert '30 days' in response.json['content']
    assert len(client.get('/api/state').json['messages']) == 2
    assert client.delete('/api/chat', headers=h).status_code == 200
    assert client.get('/api/state').json['messages'] == []

def test_validation_and_csrf(client):
    assert client.post('/api/chat', json={'message':'hello'}).status_code == 403
    h = headers(client)
    for value in ['', 'a'*2001, 123]:
        assert client.post('/api/chat', json={'message':value}, headers=h).status_code == 400
    assert client.post('/api/tickets', json={'subject':'a'}, headers=h).status_code == 400

def test_ticket_lifecycle_and_isolation(client):
    h = headers(client)
    response = client.post('/api/tickets', json={'subject':'Delayed parcel'}, headers=h)
    assert response.status_code == 201
    ticket_id = response.json['id']
    assert client.patch(f'/api/tickets/{ticket_id}', json={'status':'resolved'}, headers=h).status_code == 200
    assert client.get('/api/state').json['tickets'][0]['status'] == 'resolved'
    client.post('/api/chat', json={'message':'billing plans'}, headers=h)
    with app.test_client() as other:
        h2 = headers(other)
        assert other.get('/api/state').json['messages'] == []
        assert other.get('/api/state').json['tickets'] == []
        assert other.patch(f'/api/tickets/{ticket_id}', json={'status':'open'}, headers=h2).status_code == 404

def test_unknown_topic(client):
    response = client.post('/api/chat', json={'message':'What is the weather?'}, headers=headers(client))
    assert response.status_code == 200
    assert response.json['sources'] == []

def test_rate_limit(client):
    h = headers(client)
    for i in range(10):
        assert client.post('/api/chat', json={'message':'shipping'}, headers=h).status_code == 200
    assert client.post('/api/chat', json={'message':'shipping'}, headers=h).status_code == 429
