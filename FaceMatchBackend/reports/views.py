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
    from django.db.models import Q
    qs = (
        PersonReport.objects
        .filter(is_active=True)
        .select_related("created_by")
        .prefetch_related("photos")
        .order_by("-created_at")
    )
    if kind == "MISSING":
        return qs.filter(Q(kind="MISSING") | Q(status__in=[PersonReport.Status.VERIFIED, PersonReport.Status.RESOLVED]))
    return qs.filter(kind=kind)



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


class MissingReportDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/reports/missing/{id}/  — get missing report details (public)
    DELETE /api/reports/missing/{id}/  — delete report (owner or admin only)
    """
    serializer_class = PersonReportSerializer

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [permissions.IsAuthenticated(), IsReportOwner()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return PersonReport.objects.filter(kind="MISSING")


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
        report = serializer.save(kind="FOUND")
        # If no photo was attached, but this is a sighting for a known report, copy parent photo
        if not report.photos.exists():
            import re
            parent_id = self.request.data.get("sighted_report_id")
            if not parent_id:
                m = re.search(r"report\s+(\d+)", report.name or "", re.IGNORECASE)
                if m:
                    parent_id = m.group(1)
            if parent_id:
                try:
                    parent = PersonReport.objects.filter(pk=int(parent_id)).first()
                    if parent and parent.photos.exists():
                        p_photo = parent.photos.first()
                        if p_photo and p_photo.photo:
                            from reports.models import ReportPhoto
                            from matching.models import FaceMatch
                            new_p = ReportPhoto.objects.create(
                                report=report,
                                photo=p_photo.photo,
                                face_encoding=p_photo.face_encoding,
                                processing_status=p_photo.processing_status,
                            )
                            FaceMatch.objects.get_or_create(
                                missing_report=parent,
                                found_report=report,
                                defaults={
                                    "missing_photo": p_photo,
                                    "found_photo": new_p,
                                    "face_distance": 0.0,
                                    "review_status": FaceMatch.ReviewStatus.VERIFIED,
                                }
                            )
                except Exception as exc:
                    logger.warning("Could not auto-copy photo for sighting report #%d: %s", report.pk, exc)


class FoundReportDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/reports/found/{id}/   — get found report details (public)
    DELETE /api/reports/found/{id}/   — delete report (owner or admin only)
    """
    serializer_class = PersonReportSerializer

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [permissions.IsAuthenticated(), IsReportOwner()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return PersonReport.objects.filter(kind="FOUND")


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