from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from Accounts.permissions import IsRelative, IsPlatformAdmin
from .models import PersonReport, ReportPhoto
from .permissions import IsReportOwner
from .serializers import (
    PersonReportSerializer,
    PersonReportUpdateSerializer,
    ReportPhotoUploadSerializer,
)
from matching.services import save_photo_and_match


# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────

def _reports_for_kind(kind, request):
    """Return all active reports of a given kind for the public feed."""
    qs = (
        PersonReport.objects
        .filter(kind=kind, is_active=True)
        .select_related("created_by")
        .prefetch_related("photos")
        .order_by("-created_at")
    )
    return qs


# ─────────────────────────────────────────────────────────────────────────────
# Missing-person report endpoints (relative users create missing reports)
# ─────────────────────────────────────────────────────────────────────────────

class MissingReportListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/reports/missing/   — list all active missing reports (public)
    POST /api/reports/missing/   — create a new missing report (requires login & relative)
    """
    serializer_class = PersonReportSerializer
    parser_classes   = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsRelative()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return _reports_for_kind("MISSING", self.request)

    def perform_create(self, serializer):
        serializer.save(kind="MISSING")


class MissingReportDetailView(generics.RetrieveAPIView):
    """GET /api/reports/missing/{id}/"""
    serializer_class = PersonReportSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return PersonReport.objects.filter(kind="MISSING", is_active=True)


class MissingReportUpdateView(generics.UpdateAPIView):
    """PATCH /api/reports/missing/{id}/"""
    serializer_class   = PersonReportUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsReportOwner]
    http_method_names  = ["patch"]

    def get_queryset(self):
        return PersonReport.objects.filter(kind="MISSING", is_active=True)


class MissingReportCloseView(APIView):
    """POST /api/reports/missing/{id}/close/"""
    permission_classes = [permissions.IsAuthenticated, IsReportOwner]

    def post(self, request, pk):
        try:
            report = PersonReport.objects.get(pk=pk, kind="MISSING", is_active=True)
        except PersonReport.DoesNotExist:
            return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, report)
        report.status    = PersonReport.Status.CLOSED
        report.is_active = False
        report.save(update_fields=["status", "is_active"])
        return Response({"message": "Report closed.", "status": report.status})


# ─────────────────────────────────────────────────────────────────────────────
# Found-person report endpoints (any authenticated user may create)
# ─────────────────────────────────────────────────────────────────────────────

class FoundReportListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/reports/found/   — list all active found reports (public)
    POST /api/reports/found/   — create a new found report (requires login)
    """
    serializer_class = PersonReportSerializer
    parser_classes   = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return _reports_for_kind("FOUND", self.request)

    def perform_create(self, serializer):
        serializer.save(kind="FOUND")


class FoundReportDetailView(generics.RetrieveAPIView):
    """GET /api/reports/found/{id}/"""
    serializer_class   = PersonReportSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return PersonReport.objects.filter(kind="FOUND", is_active=True)


class FoundReportUpdateView(generics.UpdateAPIView):
    """PATCH /api/reports/found/{id}/"""
    serializer_class   = PersonReportUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsReportOwner]
    http_method_names  = ["patch"]

    def get_queryset(self):
        return PersonReport.objects.filter(kind="FOUND", is_active=True)


# ─────────────────────────────────────────────────────────────────────────────
# Photo upload (works for both kinds)
# ─────────────────────────────────────────────────────────────────────────────

class ReportPhotoUploadView(APIView):
    """
    POST /api/reports/missing/{id}/photos/
    POST /api/reports/found/{id}/photos/
    """
    permission_classes = [permissions.IsAuthenticated, IsReportOwner]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request, pk, kind):
        try:
            report = PersonReport.objects.get(pk=pk, kind=kind.upper(), is_active=True)
        except PersonReport.DoesNotExist:
            return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, report)

        serializer = ReportPhotoUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        results  = []
        warnings = []
        for photo_file in serializer.validated_data["photos"]:
            try:
                photo = save_photo_and_match(report, photo_file)
                results.append({"id": photo.pk, "status": photo.processing_status})
                if photo.processing_status == "NO_FACE":
                    warnings.append("Photo saved. No clear face detected for AI matching.")
            except Exception as exc:
                warnings.append(str(exc))

        return Response(
            {"uploaded": len(results), "photos": results, "warnings": warnings},
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# My reports (all kinds owned by the caller)
# ─────────────────────────────────────────────────────────────────────────────

class MyReportsView(generics.ListAPIView):
    """GET /api/reports/mine/"""
    serializer_class   = PersonReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            PersonReport.objects
            .filter(created_by=self.request.user, is_active=True)
            .select_related("created_by")
            .prefetch_related("photos")
            .order_by("-created_at")
        )