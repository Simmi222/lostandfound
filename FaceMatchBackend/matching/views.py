import logging
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import FaceMatch
from .serializers import FaceMatchSerializer
from .services import (
    _search_candidates,
    get_face_encoding_from_upload,
)

logger = logging.getLogger(__name__)

from reports.models import PersonReport
from reports.serializers import PersonReportSerializer, SimilarReportMatchSerializer
from reports.models import SimilarReportMatch
from notifications.models import Notification
from notifications.serializers import NotificationSerializer



class DashboardView(APIView):
    """
    GET /api/dashboard/

    Returns a combined snapshot for the authenticated user:
      - Their active reports
      - Their potential matches
      - Their unread notification count

    This is a READ-ONLY endpoint. Face-recognition is NOT triggered here.
    Run-on-upload is the source of truth; the dashboard just fetches stored results.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        reports_qs = (
            PersonReport.objects
            .filter(is_active=True)
            .prefetch_related("photos")
            .order_by("-created_at")[:10]
        )

        matches_qs = (
            FaceMatch.objects
            .select_related(
                "missing_report", "found_report",
                "missing_photo", "found_photo",
            )
            .order_by("face_distance")[:50]
        )

        unread_count = Notification.objects.filter(
            recipient=user, is_read=False
        ).count()

        return Response({
            "reports":      PersonReportSerializer(
                                reports_qs, many=True, context={"request": request}
                            ).data,
            "matches":      FaceMatchSerializer(matches_qs, many=True).data,
            "unread_notifications": unread_count,
        })


class MyMatchesView(generics.ListAPIView):
    """
    GET /api/matches/mine/

    Returns potential matches involving missing/found reports.
    Ordered by face_distance (closest = most similar first).
    """
    serializer_class   = FaceMatchSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            FaceMatch.objects
            .select_related(
                "missing_report", "found_report",
                "missing_photo", "found_photo",
            )
            .order_by("face_distance")
        )


class MatchDetailView(generics.RetrieveAPIView):
    """GET /api/matches/{id}/"""
    serializer_class   = FaceMatchSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return FaceMatch.objects.all()


class SimilarMatchesView(generics.ListAPIView):
    """GET /api/matches/similar/ — stored missing-report photo matches."""

    serializer_class = SimilarReportMatchSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            SimilarReportMatch.objects
            .select_related(
                "report_low",
                "report_high",
                "source_photo",
                "matched_photo",
            )
            .prefetch_related("report_low__photos", "report_high__photos")
            .order_by("face_distance", "-created_at")
        )


class SearchPhotoView(APIView):
    """
    POST /api/match/search/

    Upload a photo and search the database for similar faces.
    Returns candidate report summaries — NOT a definitive identification.
    The uploaded photo is NOT stored permanently.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_photo = request.FILES.get("photo")
        if not uploaded_photo:
            return Response(
                {"error": "Please upload a photo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            encoding = get_face_encoding_from_upload(uploaded_photo)

            if encoding is None:
                return Response({
                    "matches": [],
                    "message": "No face detected in the uploaded photo.",
                })

            # Tolerance 0.60 matches the same person reliably while filtering out false positives
            candidates = _search_candidates(encoding, tolerance=0.60)[:20]

            matches = []
            for distance, photo in candidates:
                try:
                    photo_url = request.build_absolute_uri(photo.photo.url) if photo.photo else ""
                except Exception:
                    photo_url = ""
                matches.append({
                    "photo_id": photo.pk,
                    "report_id": photo.report_id,
                    "kind": photo.report.kind,
                    "name": photo.report.name or "Unknown",
                    "age": photo.report.age,
                    "description": photo.report.description,
                    "last_seen_place": photo.report.last_seen_place,
                    "created_by_username": photo.report.created_by.username,
                    "photo_url": photo_url,
                    "face_distance": round(float(distance), 4),
                    "candidate_match": True,
                })

            return Response({"matches": matches})

        except Exception as exc:
            logger.exception("Photo search error: %s", exc)
            return Response(
                {"error": f"Search failed: {str(exc)}", "matches": []},
                status=status.HTTP_400_BAD_REQUEST,
            )
        finally:
            if uploaded_photo:
                try:
                    uploaded_photo.close()
                except Exception:
                    pass


class SearchNameView(APIView):
    """
    GET /api/matches/search-by-name/?q=...

    Searches all active missing-person reports by name. Private contact
    information is intentionally excluded from the public search result.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Q

        query = request.query_params.get("q", "").strip()
        if not query:
            return Response(
                {"error": "Enter a person name to search."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reports = (
            PersonReport.objects
            .filter(kind="MISSING", is_active=True)
            .filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(last_seen_place__icontains=query)
            )
            .select_related("created_by")
            .prefetch_related("photos")
            .order_by("-created_at")
        )

        results = []
        for report in reports:
            first_photo = report.photos.first()
            results.append({
                "report_id": report.pk,
                "kind": report.kind,
                "name": report.name or "Unknown",
                "age": report.age,
                "description": report.description,
                "last_seen_place": report.last_seen_place,
                "lost_or_found_date": report.lost_or_found_date,
                "created_by_username": report.created_by.username,
                "photo_url": (
                    request.build_absolute_uri(first_photo.photo.url)
                    if first_photo else None
                ),
            })

        return Response({"matches": results})


class RecordMatchDecisionView(APIView):
    """
    POST /api/matches/record-decision/

    Allows user to confirm or reject a search match.
    When decision is FOUND:
      - Creates a corresponding verified report with the searched photo
      - Saves a verified FaceMatch record
      - Stores the result permanently in Matched cases
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        decision = request.data.get("decision", "").strip().upper()
        report_id = request.data.get("report_id")
        uploaded_photo = request.FILES.get("photo")
        face_dist = request.data.get("face_distance", 0.5)
        try:
            face_dist = float(face_dist)
        except (ValueError, TypeError):
            face_dist = 0.5

        if not report_id:
            return Response({"error": "Report ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_report = PersonReport.objects.get(pk=report_id)
        except PersonReport.DoesNotExist:
            return Response({"error": "Target report not found."}, status=status.HTTP_404_NOT_FOUND)

        if decision == "NOT_FOUND":
            return Response({
                "status": "NOT_FOUND",
                "message": "Result marked as not a match.",
            })

        if decision == "FOUND":
            from reports.models import ReportPhoto
            from .services import save_photo_and_match, _notify_for_match

            # 1. Create a counter-report with the confirmation
            counterpart_kind = "FOUND" if target_report.kind == "MISSING" else "MISSING"
            counterpart_report = PersonReport.objects.create(
                created_by=request.user,
                kind=counterpart_kind,
                status=PersonReport.Status.VERIFIED,
                name=f"Verified match for {target_report.name or 'Report #' + str(target_report.pk)}",
                last_seen_place=target_report.last_seen_place or "Spotted via search",
                description=f"Confirmed face match with {target_report.kind.lower()} report #{target_report.pk} ({target_report.name or 'Unknown'}).",
                colour=target_report.colour,
                height=target_report.height,
                age=target_report.age,
                gender=target_report.gender,
            )

            # 2. Save uploaded photo under this new report if provided
            new_photo = None
            if uploaded_photo:
                try:
                    new_photo = save_photo_and_match(counterpart_report, uploaded_photo)
                except Exception as photo_err:
                    logger.warning("Could not process search photo for match: %s", photo_err)

            if not new_photo and target_report.photos.exists():
                source_p = target_report.photos.first()
                if source_p and source_p.photo:
                    try:
                        new_photo = ReportPhoto.objects.create(
                            report=counterpart_report,
                            photo=source_p.photo,
                            face_encoding=source_p.face_encoding,
                            processing_status=source_p.processing_status,
                        )
                    except Exception as copy_err:
                        logger.warning("Could not duplicate photo for match: %s", copy_err)

            # 3. Create verified FaceMatch or SimilarReportMatch
            if target_report.kind == "MISSING" and counterpart_kind == "FOUND":
                missing_rep, found_rep = target_report, counterpart_report
                missing_p = target_report.photos.first()
                found_p = new_photo
                match, created = FaceMatch.objects.get_or_create(
                    missing_report=missing_rep,
                    found_report=found_rep,
                    defaults={
                        "missing_photo": missing_p,
                        "found_photo": found_p,
                        "face_distance": face_dist,
                        "review_status": FaceMatch.ReviewStatus.VERIFIED,
                        "reviewed_by": request.user,
                    }
                )
                if not created:
                    match.review_status = FaceMatch.ReviewStatus.VERIFIED
                    match.reviewed_by = request.user
                    match.save(update_fields=["review_status", "reviewed_by"])
                _notify_for_match(match)
            else:
                low, high = sorted([target_report, counterpart_report], key=lambda r: r.pk)
                SimilarReportMatch.objects.get_or_create(
                    report_low=low,
                    report_high=high,
                    defaults={
                        "source_photo": low.photos.first(),
                        "matched_photo": high.photos.first(),
                        "face_distance": face_dist,
                        "review_status": SimilarReportMatch.ReviewStatus.VERIFIED,
                    }
                )

            # Update target report status
            target_report.status = PersonReport.Status.VERIFIED
            target_report.save(update_fields=["status"])

            return Response({
                "status": "FOUND",
                "message": "Match successfully recorded and saved to Matched cases!",
                "report_id": counterpart_report.pk,
            })

        return Response({"error": "Invalid decision. Choose FOUND or NOT_FOUND."}, status=status.HTTP_400_BAD_REQUEST)