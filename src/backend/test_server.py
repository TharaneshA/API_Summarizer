import pytest
from fastapi.testclient import TestClient
from server import app
import json

# Initialize test client
client = TestClient(app)

# Test data
test_text = "This is a sample text for testing the summarization endpoint."
test_chat_message = "What does this API do?"
test_chat_context = "This is a context about the API."

def test_summarize_endpoint():
    # Test successful summarization
    response = client.post(
        "/summarize",
        json={"text": test_text}
    )
    assert response.status_code == 200
    assert "summary" in response.json()

    # Test invalid request
    response = client.post(
        "/summarize",
        json={"invalid_key": test_text}
    )
    assert response.status_code == 422  # Validation error

def test_chat_endpoint():
    # Test successful chat
    response = client.post(
        "/chat",
        json={
            "message": test_chat_message,
            "context": test_chat_context
        }
    )
    assert response.status_code == 200
    assert "response" in response.json()

    # Test invalid request
    response = client.post(
        "/chat",
        json={"message": test_chat_message}  # Missing context
    )
    assert response.status_code == 422  # Validation error

def test_cors_headers():
    # Test CORS headers for OPTIONS request
    response = client.options(
        "/summarize",
        headers={
            "Origin": "chrome-extension://example",
            "Access-Control-Request-Method": "POST"
        }
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
    assert "access-control-allow-methods" in response.headers
    assert "access-control-allow-headers" in response.headers

    # Test CORS headers for actual request
    response = client.post(
        "/summarize",
        json={"text": test_text},
        headers={"Origin": "chrome-extension://example"}
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers

def test_error_handling():
    # Test internal server error handling
    response = client.post(
        "/summarize",
        json={"text": ""}  # Empty text should cause an error
    )
    assert response.status_code == 500
    assert "detail" in response.json()