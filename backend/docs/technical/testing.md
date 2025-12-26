# Testing Infrastructure

## Comprehensive Test Suite with pytest

Built a robust testing infrastructure using pytest with Django integration for comprehensive test coverage.

### Test Configuration

**Global Fixtures (`conftest.py`):**

```python
import pytest
from rest_framework.test import APIClient
from players.models import Player
from pokemon.models import Pokemon, PokemonType, TypeEffectiveness

@pytest.fixture
def api_client():
    """DRF API client for testing."""
    return APIClient()

@pytest.fixture
def create_player(db):
    """Factory function for creating test players."""
    def _create_player(username="testuser", password="TestPass123!", **kwargs):
        return Player.objects.create_user(
            username=username,
            password=password,
            **kwargs
        )
    return _create_player

@pytest.fixture
def create_pokemon_type(db):
    """Factory function for creating Pokemon types."""
    def _create_pokemon_type(name="fire", **kwargs):
        return PokemonType.objects.create(name=name, **kwargs)
    return _create_pokemon_type

@pytest.fixture
def create_pokemon(db, create_pokemon_type):
    """Factory function for creating test Pokemon."""
    def _create_pokemon(
        name="Pikachu",
        pokedex_number=25,
        primary_type=None,
        secondary_type=None,
        **kwargs
    ):
        if primary_type is None:
            primary_type = create_pokemon_type(name="electric")

        defaults = {
            "base_hp": 35,
            "base_attack": 55,
            "base_defense": 40,
            "base_speed": 90,
            "sprite_url": "https://example.com/pikachu.png",
            "primary_type": primary_type,
            "secondary_type": secondary_type,
            **kwargs,
        }
        return Pokemon.objects.create(
            name=name,
            pokedex_number=pokedex_number,
            **defaults
        )
    return _create_pokemon
```

---

## Test Examples

### Authentication Tests

**Registration Tests:**

```python
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
```

**Login Tests:**

```python
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
```

**Token Refresh Tests:**

```python
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
```

---

## Testing Best Practices

### Test Organization

1. **Class-Based Tests:** Group related tests in classes
2. **Descriptive Names:** Test names describe what they test
3. **Setup Fixtures:** Use `autouse=True` for common setup
4. **Factory Functions:** Reusable test data creation

### Test Coverage

**Current Coverage:**
- ✅ Authentication endpoints (register, login, refresh)
- ✅ Player model and serializers
- ✅ Error handling and validation
- ✅ Edge cases and boundary conditions

**Test Types:**
- **Unit Tests:** Test individual functions/methods
- **Integration Tests:** Test API endpoints end-to-end
- **Model Tests:** Test database operations
- **Serializer Tests:** Test data validation

### Test Isolation

```python
@pytest.mark.django_db  # Each test gets isolated database
class TestSomething:
    def test_one(self):
        # Database is clean here
        pass

    def test_two(self):
        # Database is clean here too (not affected by test_one)
        pass
```

### Assertions

**Clear Assertions:**

```python
# Good: Clear what's being tested
assert response.status_code == status.HTTP_201_CREATED
assert json_response["username"] == "newuser"
assert Player.objects.filter(username="newuser").exists()

# Good: Check structure
assert set(json_response.keys()) == {"id", "username", "created_at", "token"}
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
pytest

# Run specific test file
pytest backend/players/tests/test_auth.py

# Run specific test
pytest backend/players/tests/test_auth.py::TestAuthRegisterPOST::test_register_with_valid_data_returns_201

# Run with coverage
pytest --cov=backend --cov-report=html

# Run with verbose output
pytest -v
```

### Test Configuration

**`pytest.ini`:**

```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
python_files = tests.py test_*.py *_tests.py
python_classes = Test*
python_functions = test_*
addopts =
    --strict-markers
    --tb=short
```

---

## Test Metrics

- **Test Count:** 15+ test cases
- **Coverage Areas:** Authentication, Models, Serializers
- **Test Speed:** Fast execution (< 5 seconds)
- **Reliability:** 100% pass rate
