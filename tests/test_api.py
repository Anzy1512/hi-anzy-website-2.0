"""Regression tests against a real, isolated local MongoDB database."""
import os
import sys
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, Mock

import pytest

TEST_DB = 'hianzy_test_' + uuid.uuid4().hex
os.environ.update(MONGO_URL=os.environ.get('TEST_MONGO_URL', 'mongodb://127.0.0.1:27117'), DB_NAME=TEST_DB,
                  ENVIRONMENT='development', CONTACT_NOTIFY_EMAIL='', RESEND_API_KEY='', SMTP_HOST='',
                  CORS_ORIGINS='http://127.0.0.1:3100', COOKIE_SECURE='false', COOKIE_SAMESITE='lax')
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
import server
from fastapi.testclient import TestClient


@pytest.fixture(scope='module')
def api():
    with TestClient(server.app) as client:
        yield client
        async def cleanup():
            assert server.db.name == TEST_DB and TEST_DB.startswith('hianzy_test_')
            await server.client.drop_database(TEST_DB)
        client.portal.call(cleanup)


@pytest.fixture(autouse=True)
def reset_limits():
    server._rate.clear()


def db_call(api, collection, method, *args, **kwargs):
    async def run():
        return await getattr(server.db[collection], method)(*args, **kwargs)
    return api.portal.call(run)


CONTACT = {'name': 'Audit Tester', 'email': 'audit@example.com', 'message': 'Local regression test only.'}


def test_health_and_security_headers(api):
    response = api.get('/api/health')
    assert response.json() == {'status': 'ok', 'db': 'connected'}
    assert response.headers['x-content-type-options'] == 'nosniff'


def test_health_failure_returns_503(api, monkeypatch):
    monkeypatch.setattr(server.db, 'command', AsyncMock(side_effect=RuntimeError('offline')))
    assert api.get('/api/health').status_code == 503


@pytest.mark.parametrize('route,min_count', [('case-studies',5), ('network',20), ('ecosystem',6), ('insights',6), ('portfolio',1)])
def test_seeded_content(api, route, min_count):
    response = api.get('/api/' + route)
    assert response.status_code == 200
    assert len(response.json()) >= min_count
    assert all('_id' not in item for item in response.json())


@pytest.mark.parametrize('route', ['case-studies', 'insights'])
def test_detail_and_missing_routes(api, route):
    item = api.get('/api/' + route).json()[0]
    assert api.get('/api/' + route + '/' + item['slug']).json()['slug'] == item['slug']
    assert api.get('/api/' + route + '/not-a-real-slug').status_code == 404


@pytest.mark.parametrize('route', ['insights', 'network', 'ecosystem'])
def test_category_filter(api, route):
    category = api.get('/api/' + route).json()[0]['category']
    items = api.get('/api/' + route, params={'category': category}).json()
    assert items and all(item['category'] == category for item in items)


def test_contact_persists_normalized_fields(api):
    response = api.post('/api/contact', json={**CONTACT, 'name': '  Audit Tester  '})
    assert response.status_code == 200
    assert response.json()['emailSent'] is False
    saved = db_call(api, 'contact_submissions', 'find_one', {'id': response.json()['id']})
    assert saved['name'] == 'Audit Tester'


@pytest.mark.parametrize('field,value', [('name','  '), ('message','          '), ('email','invalid'), ('company','x'*201), ('message','x'*4001)])
def test_contact_validation(api, field, value):
    assert api.post('/api/contact', json={**CONTACT, field:value}).status_code == 422


def test_contact_rate_limit_is_not_false_success(api):
    for _ in range(5):
        assert api.post('/api/contact', json=CONTACT).json()['id']
    before = db_call(api, 'contact_submissions', 'count_documents', {})
    response = api.post('/api/contact', json=CONTACT)
    assert response.status_code == 429 and response.headers['retry-after'] == '600'
    assert db_call(api, 'contact_submissions', 'count_documents', {}) == before


def test_honeypot_does_not_persist(api):
    before = db_call(api, 'contact_submissions', 'count_documents', {})
    assert api.post('/api/contact', json={**CONTACT, 'orgField':'bot'}).json()['id'] is None
    assert db_call(api, 'contact_submissions', 'count_documents', {}) == before


def test_subscription_idempotence_and_privacy(api):
    a = api.post('/api/subscribe', json={'email':'Subscriber@example.com'})
    b = api.post('/api/subscribe', json={'email':'subscriber@example.com'})
    assert a.json() == b.json() == {'ok': True}
    assert db_call(api, 'subscribers', 'count_documents', {'email':'subscriber@example.com'}) == 1


def test_subscription_rate_limit(api):
    for _ in range(5):
        assert api.post('/api/subscribe', json={'email':'limit@example.com'}).status_code == 200
    assert api.post('/api/subscribe', json={'email':'limit@example.com'}).status_code == 429


@pytest.mark.parametrize('expiry', [None, 'not-a-date', '2026-01-01T00:00:00', '2000-01-01T00:00:00+00:00', 123])
def test_invalid_sessions_fail_closed(api, expiry):
    token = uuid.uuid4().hex
    db_call(api, 'user_sessions', 'insert_one', {'session_token':token, 'user_id':'audit-user', 'expiresAt':expiry})
    assert api.get('/api/auth/me', headers={'Authorization':'Bearer '+token}).status_code == 401


def test_admin_authorization(api, monkeypatch):
    db_call(api, 'users', 'insert_one', {'user_id':'audit-admin', 'email':'admin@example.com'})
    token = uuid.uuid4().hex
    db_call(api, 'user_sessions', 'insert_one', {'session_token':token, 'user_id':'audit-admin', 'expiresAt':(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()})
    headers = {'Authorization':'Bearer '+token}
    monkeypatch.setenv('ADMIN_EMAILS','other@example.com')
    for route in ['contact-submissions', 'subscribers']:
        assert api.get('/api/'+route).status_code == 401
        assert api.get('/api/'+route, headers=headers).status_code == 403
    monkeypatch.setenv('ADMIN_EMAILS','admin@example.com')
    result = api.get('/api/contact-submissions', headers=headers)
    assert result.status_code == 200 and all('ip' not in item for item in result.json())


@pytest.mark.parametrize('event', [{'name':'unknown'}, {'name':'cta_primary_click','meta':{'nested':{}}}, {'name':'cta_primary_click','path':'invalid'}])
def test_analytics_validation(api, event):
    assert api.post('/api/analytics/event', json=event).status_code == 422


def test_invalid_auth_provider_json(api, monkeypatch):
    monkeypatch.setattr(server.http_requests, 'get', Mock(return_value=Mock(status_code=200, json=Mock(side_effect=ValueError()))))
    assert api.post('/api/auth/session', headers={'X-Session-ID':'test-only'}).status_code == 502


@pytest.mark.parametrize('profile', [
    {'email': {'address': 'test@example.com'}},
    {'email': 'not-an-email'},
    {'email': 'test@example.com', 'name': []},
    {'email': 'test@example.com', 'picture': {'url': 'invalid'}},
])
def test_malformed_provider_profile_creates_no_account(api, monkeypatch, profile):
    before = db_call(api, 'users', 'count_documents', {})
    monkeypatch.setattr(server.http_requests, 'get', Mock(return_value=Mock(
        status_code=200, json=Mock(return_value=profile))))
    response = api.post('/api/auth/session', headers={'X-Session-ID': 'test-only'})
    assert response.status_code == 502
    assert db_call(api, 'users', 'count_documents', {}) == before


def test_repeated_sign_in_preserves_user_and_logout_revokes_bearer(api, monkeypatch):
    api.cookies.clear()
    profile = {'email': 'signin@example.com', 'name': 'First name', 'picture': None}
    monkeypatch.setattr(server.http_requests, 'get', Mock(return_value=Mock(
        status_code=200, json=Mock(side_effect=lambda: dict(profile)))))
    first = api.post('/api/auth/session', headers={'X-Session-ID': 'first-test-only'})
    assert first.status_code == 200
    identity = first.json()['user']['id']
    token = first.cookies.get(server.SESSION_COOKIE)
    assert token and 'httponly' in first.headers['set-cookie'].lower()
    api.cookies.clear()
    profile['name'] = 'Updated name'
    second = api.post('/api/auth/session', headers={'X-Session-ID': 'second-test-only'})
    assert second.json()['user']['id'] == identity
    assert second.json()['user']['name'] == 'Updated name'
    assert db_call(api, 'users', 'count_documents', {'email': profile['email']}) == 1
    api.cookies.clear()
    headers = {'Authorization': 'bearer ' + token}
    me = api.get('/api/auth/me', headers=headers)
    assert me.status_code == 200
    assert set(me.json()) == {'id', 'email', 'name', 'picture'}
    assert api.post('/api/auth/logout', headers=headers).json() == {'ok': True}
    assert api.get('/api/auth/me', headers=headers).status_code == 401


def test_logout_revokes_cookie_session(api, monkeypatch):
    api.cookies.clear()
    monkeypatch.setattr(server.http_requests, 'get', Mock(return_value=Mock(
        status_code=200, json=Mock(return_value={'email': 'cookie@example.com'}))))
    login = api.post('/api/auth/session', headers={'X-Session-ID': 'cookie-test-only'})
    token = login.cookies.get(server.SESSION_COOKIE)
    assert api.get('/api/auth/me').status_code == 200
    assert api.post('/api/auth/logout').status_code == 200
    assert db_call(api, 'user_sessions', 'find_one', {'session_token': token}) is None
    assert api.get('/api/auth/me').status_code == 401
    api.cookies.clear()


def test_subscription_trims_whitespace(api):
    response = api.post('/api/subscribe', json={'email': '  trimmed@example.com  '})
    assert response.json() == {'ok': True}
    assert db_call(api, 'subscribers', 'count_documents', {'email': 'trimmed@example.com'}) == 1


def test_contact_survives_email_provider_failure(api, monkeypatch):
    monkeypatch.setenv('CONTACT_NOTIFY_EMAIL', 'notify@example.com')
    monkeypatch.setenv('RESEND_FROM', 'sender@example.com')
    monkeypatch.setenv('RESEND_API_KEY', 'fake-test-key')
    monkeypatch.setattr(server.http_requests, 'post', Mock(side_effect=TimeoutError()))
    response = api.post('/api/contact', json=CONTACT)
    assert response.status_code == 200 and response.json()['emailSent'] is False
    assert db_call(api, 'contact_submissions', 'find_one', {'id': response.json()['id']})


def test_smtp_has_timeout_and_sanitizes_subject(monkeypatch):
    monkeypatch.setenv('SMTP_HOST', 'smtp.example.com')
    monkeypatch.setenv('SMTP_USER', '')
    monkeypatch.setenv('SMTP_PORT', '587')
    transport = Mock()
    smtp_context = Mock()
    smtp_context.__enter__ = Mock(return_value=transport)
    smtp_context.__exit__ = Mock(return_value=False)
    factory = Mock(return_value=smtp_context)
    monkeypatch.setattr(server.smtplib, 'SMTP', factory)
    assert server._send_email_sync(
        'Enquiry\r\nBcc: stranger@example.com', 'Test only',
        'notify@example.com', 'sender@example.com') is True
    factory.assert_called_once_with('smtp.example.com', 587, timeout=10)
    message = transport.send_message.call_args.args[0]
    assert message['Bcc'] is None
    assert '\n' not in message['Subject'] and '\r' not in message['Subject']


@pytest.mark.parametrize('value', [float('inf'), float('-inf'), float('nan')])
def test_analytics_rejects_non_finite_numbers(value):
    with pytest.raises(ValueError):
        server.AnalyticsEvent(name='cta_primary_click', meta={'value': value})


def test_rate_limit_expires_without_blocking_other_routes(monkeypatch):
    clock = [100.0]
    monkeypatch.setattr(server.time, 'monotonic', lambda: clock[0])
    assert server.rate_limited('contact', 'visitor', max_hits=1, window_seconds=10) is False
    assert server.rate_limited('contact', 'visitor', max_hits=1, window_seconds=10) is True
    assert server.rate_limited('analytics', 'visitor', max_hits=1, window_seconds=10) is False
    clock[0] += 10
    assert server.rate_limited('contact', 'visitor', max_hits=1, window_seconds=10) is False


def test_startup_failure_closes_database_client(monkeypatch):
    import asyncio

    database_client = Mock()
    monkeypatch.setattr(server, 'client', database_client)
    monkeypatch.setattr(server, 'seed', AsyncMock(side_effect=RuntimeError('startup failed')))

    async def start():
        async with server.lifespan(server.app):
            pytest.fail('Startup should not have completed')

    with pytest.raises(RuntimeError, match='startup failed'):
        asyncio.run(start())
    database_client.close.assert_called_once_with()


def test_seed_skips_unchanged_content_and_preserves_creation_date(api):
    async def check():
        collection = server.db.seed_regression
        record = {'slug': 'seed-check', 'title': 'Original'}
        assert await server.upsert_all(collection, [record], 'slug') == 1
        first = await collection.find_one({'slug': record['slug']})
        assert await server.upsert_all(collection, [record], 'slug') == 0
        assert await collection.find_one({'slug': record['slug']}) == first
        assert await server.upsert_all(collection, [{**record, 'title': 'Revised'}], 'slug') == 1
        changed = await collection.find_one({'slug': record['slug']})
        assert changed['createdAt'] == first['createdAt']
        assert changed['title'] == 'Revised'
    api.portal.call(check)


def test_local_preview_cors_and_unknown_origins(api):
    headers = {'Origin': 'http://127.0.0.1:3100', 'Access-Control-Request-Method': 'POST'}
    allowed = api.options('/api/contact', headers=headers)
    assert allowed.status_code == 200
    assert allowed.headers['access-control-allow-origin'] == headers['Origin']
    refused = api.options('/api/contact', headers={**headers, 'Origin': 'https://untrusted.example'})
    assert 'access-control-allow-origin' not in refused.headers
