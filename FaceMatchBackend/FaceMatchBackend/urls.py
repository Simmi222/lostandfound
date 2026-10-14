"""
Root URL configuration for FaceMatchBackend.

All application routes are prefixed with /api/ to clearly separate
the REST API from Django admin and static/media file serving.
"""

from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ── Django admin ─────────────────────────────────────────────────────────
    path("admin/", admin.site.urls),

    # ── Authentication ────────────────────────────────────────────────────────
    path("api/auth/",          include("Accounts.urls")),

    # ── Reports ───────────────────────────────────────────────────────────────
    path("api/reports/",       include("reports.urls")),

    # ── Matching & Dashboard ──────────────────────────────────────────────────
    path("api/matches/",       include("matching.urls")),

    # ── Notifications ─────────────────────────────────────────────────────────
    path("api/notifications/", include("notifications.urls")),
]

# Serve uploaded media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
