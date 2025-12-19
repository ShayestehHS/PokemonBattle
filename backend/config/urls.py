from django.conf import settings
from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

base_urlpatterns = [
    path("players/", include("players.urls", namespace="players")),
    path("pokemon/", include("pokemon.urls", namespace="pokemon")),
]

if settings.DEBUG:
    import os

    from django.views.static import serve

    def serve_mkdocs(request, path=""):
        """Serve MkDocs static site, defaulting to index.html for directory paths."""
        document_root = os.path.join(settings.BASE_DIR, "site")

        if not path or path.endswith("/"):
            path = os.path.join(path, "index.html")

        return serve(request, path, document_root=document_root)

    base_urlpatterns += [
        path("schema/", SpectacularAPIView.as_view(), name="schema"),
        re_path(r"^docs/(?P<path>.*)$", serve_mkdocs, name="mkdocs"),
        re_path(r"^static/(?P<path>.*)$", serve, {"document_root": settings.STATIC_ROOT}),
        # Swagger doc as fallback of the drf-to-mkdoc plugin
        path("docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]

urlpatterns = [
    path("api/", include(base_urlpatterns)),
]
