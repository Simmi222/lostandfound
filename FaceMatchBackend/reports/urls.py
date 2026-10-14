from django.urls import path
from .views import (
    MissingReportListCreateView,
    MissingReportDetailView,
    MissingReportUpdateView,
    MissingReportCloseView,
    FoundReportListCreateView,
    FoundReportDetailView,
    FoundReportUpdateView,
    ReportPhotoUploadView,
    MyReportsView,
)

urlpatterns = [
    # ── Missing-person endpoints ─────────────────────────────────────────
    path("missing/",
         MissingReportListCreateView.as_view(),
         name="missing-list-create"),

    path("missing/<int:pk>/",
         MissingReportDetailView.as_view(),
         name="missing-detail"),

    path("missing/<int:pk>/update/",
         MissingReportUpdateView.as_view(),
         name="missing-update"),

    path("missing/<int:pk>/close/",
         MissingReportCloseView.as_view(),
         name="missing-close"),

    path("missing/<int:pk>/photos/",
         ReportPhotoUploadView.as_view(),
         {"kind": "missing"},
         name="missing-photos"),

    # ── Found / sighted-person endpoints ────────────────────────────────
    path("found/",
         FoundReportListCreateView.as_view(),
         name="found-list-create"),

    path("found/<int:pk>/",
         FoundReportDetailView.as_view(),
         name="found-detail"),

    path("found/<int:pk>/update/",
         FoundReportUpdateView.as_view(),
         name="found-update"),

    path("found/<int:pk>/photos/",
         ReportPhotoUploadView.as_view(),
         {"kind": "found"},
         name="found-photos"),

    # ── Caller's own reports ─────────────────────────────────────────────
    path("mine/",
         MyReportsView.as_view(),
         name="my-reports"),
]