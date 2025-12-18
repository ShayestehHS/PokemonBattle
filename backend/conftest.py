import pytest
from rest_framework.test import APIClient

from players.models import Player


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_player(db):
    def _create_player(username="testuser", password="TestPass123!", **kwargs):
        return Player.objects.create_user(username=username, password=password, **kwargs)

    return _create_player
