# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import FaceMatch


class FaceMatchSerializer(serializers.ModelSerializer):
    """
    Serializer for a potential facial match.

    IMPORTANT: face_distance is NOT a probability.  The frontend must
    always present it as a candidate result requiring human verification.
    """

    # Nested summaries — do NOT expose sensitive contact data here
    missing_report_summary = serializers.SerializerMethodField()
    found_report_summary   = serializers.SerializerMethodField()

    class Meta:
        model  = FaceMatch
        fields = [
            "id",
            "missing_report",
            "found_report",
            "missing_report_summary",
            "found_report_summary",
            "missing_photo",
            "found_photo",
            "face_distance",
            "algorithm_version",
            "review_status",
            "reviewed_by",
            "reviewed_at",
            "created_at",
        ]
        read_only_fields = fields

    def _report_summary(self, report):
        """Return safe, non-sensitive summary of a report."""
        if report is None:
            return None
        first_photo = report.photos.first()
        photo_url = None
        if first_photo and first_photo.photo:
            url = first_photo.photo.url
            photo_url = f"http://127.0.0.1:8000{url}" if not url.startswith("http") else url
        return {
            "id":              report.pk,
            "kind":            report.kind,
            "status":          report.status,
            "name":            report.name or "Unknown",
            "age":             report.age,
            "gender":          report.gender,
            "last_seen_place": report.last_seen_place,
            "description":     report.description[:200] if report.description else "",
            "photo_url":        photo_url,
        }

    def get_missing_report_summary(self, obj):
        return self._report_summary(obj.missing_report)

    def get_found_report_summary(self, obj):
        return self._report_summary(obj.found_report)