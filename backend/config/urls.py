"""
URL configuration for Pokemon Battle API project.
"""

from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # API v1
    path('api/v1/auth/', include('players.urls.auth', namespace='auth')),
    path('api/v1/players/', include('players.urls.players', namespace='players')),
    path('api/v1/pokemon/', include('pokemon.urls', namespace='pokemon')),
    path('api/v1/battles/', include('battles.urls', namespace='battles')),
    path('api/v1/scoreboard/', include('scoreboard.urls', namespace='scoreboard')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

