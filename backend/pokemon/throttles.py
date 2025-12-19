from rest_framework.throttling import UserRateThrottle


class PokeAPIThrottle(UserRateThrottle):
    scope = "pokeapi"
