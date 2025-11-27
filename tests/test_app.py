import copy
from fastapi.testclient import TestClient
import pytest

from src.app import app, activities as activities_dict


@pytest.fixture(autouse=True)
def reset_activities():
    # Keep a deep copy of activities and restore after each test to avoid shared state across tests
    original = copy.deepcopy(activities_dict)
    yield
    activities_dict.clear()
    activities_dict.update(original)


client = TestClient(app)


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    # should have some activities predefined
    assert "Basketball Team" in data
    assert "participants" in data["Basketball Team"]


def test_signup_adds_participant():
    activity_name = "Soccer Club"
    email = "testuser@example.com"
    # Ensure not already in participants
    assert email not in activities_dict[activity_name]["participants"]

    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    body = response.json()
    assert "Signed up" in body.get("message", "")
    assert email in activities_dict[activity_name]["participants"]


def test_signup_duplicate_fails():
    activity_name = "Soccer Club"
    email = "duplicate@example.com"
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    # Try again - should fail with 400
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400


def test_signup_activity_not_found():
    response = client.post("/activities/NotAnActivity/signup?email=who@example.com")
    assert response.status_code == 404


def test_unregister_removes_participant():
    activity_name = "Soccer Club"
    email = "remove_me@example.com"
    # Sign up first
    client.post(f"/activities/{activity_name}/signup?email={email}")
    assert email in activities_dict[activity_name]["participants"]

    # Now unregister
    response = client.delete(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 200
    assert email not in activities_dict[activity_name]["participants"]


def test_unregister_nonexistent_returns_404():
    activity_name = "Soccer Club"
    email = "not_in_list@example.com"
    response = client.delete(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 404


def test_unregister_activity_not_found_returns_404():
    response = client.delete("/activities/NotAnActivity/unregister?email=who@example.com")
    assert response.status_code == 404
