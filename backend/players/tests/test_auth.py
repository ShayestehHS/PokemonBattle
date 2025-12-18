import pytest
from django.urls import reverse
from rest_framework import status

from players.models import Player


@pytest.mark.django_db
class TestAuthRegisterPOST:
    @pytest.fixture(autouse=True)
    def setup(self, api_client):
        self.client = api_client
        self.url = reverse("players:auth-register")

    def test_register_with_valid_data_returns_201(self):
        data = {"username": "newuser", "password": "StrongPass123!"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_201_CREATED
        assert set(json_response.keys()) == {"id", "username", "created_at", "token"}
        assert set(json_response["token"].keys()) == {"access", "refresh"}

        assert json_response["username"] == "newuser"
        assert Player.objects.filter(username="newuser").exists()

    def test_register_with_duplicate_username_returns_400(self, create_player):
        create_player(username="existinguser")
        data = {"username": "existinguser", "password": "StrongPass123!"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert json_response == {"username": ["Player with this username already exists."]}

    def test_register_with_weak_password_returns_400(self):
        data = {"username": "newuser", "password": "123"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "password" in json_response

    def test_register_without_username_returns_400(self):
        data = {"password": "StrongPass123!"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert json_response == {"username": ["This field is required."]}

    def test_register_without_password_returns_400(self):
        data = {"username": "newuser"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert json_response == {"password": ["This field is required."]}


@pytest.mark.django_db
class TestAuthLoginPOST:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, create_player):
        self.client = api_client
        self.url = reverse("players:auth-login")
        self.player = create_player(username="testuser", password="TestPass123!")

    def test_login_with_valid_credentials_returns_200(self):
        data = {"username": "testuser", "password": "TestPass123!"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert set(json_response.keys()) == {"id", "username", "created_at", "token"}
        assert set(json_response["token"].keys()) == {"access", "refresh"}
        assert json_response["username"] == "testuser"

    def test_login_with_invalid_password_returns_400(self):
        data = {"username": "testuser", "password": "WrongPassword123!"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert json_response == {"detail": ["Invalid credentials."]}

    def test_login_with_nonexistent_user_returns_400(self):
        data = {"username": "nonexistent", "password": "TestPass123!"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert json_response == {"detail": ["Invalid credentials."]}


@pytest.mark.django_db
class TestAuthRefreshPOST:
    @pytest.fixture(autouse=True)
    def setup(self, api_client, create_player):
        self.client = api_client
        self.url = reverse("players:auth-refresh")
        self.login_url = reverse("players:auth-login")
        self.player = create_player(username="testuser", password="TestPass123!")

    def _get_refresh_token(self):
        response = self.client.post(
            self.login_url,
            data={"username": "testuser", "password": "TestPass123!"},
        )
        return response.json()["token"]["refresh"]

    def test_refresh_with_valid_token_returns_200(self):
        refresh_token = self._get_refresh_token()
        data = {"refresh": refresh_token}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert set(json_response.keys()) == {"access", "refresh"}
        assert json_response["access"]
        assert json_response["refresh"]

    def test_refresh_with_invalid_token_returns_401(self):
        data = {"refresh": "invalid_token"}

        response = self.client.post(self.url, data=data)
        json_response = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert json_response == {"detail": "Token is invalid"}
