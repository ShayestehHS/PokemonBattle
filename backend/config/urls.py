from django.conf import settings
from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("api/", include("players.urls", namespace="players")),
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

    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
        re_path(r"^api/docs/(?P<path>.*)$", serve_mkdocs, name="mkdocs"),
        re_path(
            r"^static/(?P<path>.*)$",
            serve,
            {"document_root": settings.STATIC_ROOT},
        ),
    ]
