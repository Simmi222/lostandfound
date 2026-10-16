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
    missing_photo_url      = serializers.SerializerMethodField()
    found_photo_url        = serializers.SerializerMethodField()

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
            "missing_photo_url",
            "found_photo_url",
            "face_distance",
            "algorithm_version",
            "review_status",
            "reviewed_by",
            "reviewed_at",
            "created_at",
        ]
        read_only_fields = fields

    def _resolve_photo_url(self, photo_obj):
        if not photo_obj or not photo_obj.photo:
            return None
        url = photo_obj.photo.url
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)
        return url

    def _report_summary(self, report, fallback_photo=None):
        """Return safe, non-sensitive summary of a report."""
        if report is None:
            return None
        photo_obj = (report.photos.first() if hasattr(report, "photos") else None) or fallback_photo
        photo_url = self._resolve_photo_url(photo_obj)
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
        return self._report_summary(obj.missing_report, obj.missing_photo)

    def get_found_report_summary(self, obj):
        # Fallback to missing_report's photo if found_report doesn't have its own photo
        fallback = obj.found_photo or (obj.missing_photo if obj.missing_report else None)
        return self._report_summary(obj.found_report, fallback)

    def get_missing_photo_url(self, obj):
        photo_obj = obj.missing_photo or (obj.missing_report.photos.first() if obj.missing_report else None)
        return self._resolve_photo_url(photo_obj)

    def get_found_photo_url(self, obj):
        photo_obj = obj.found_photo or (obj.found_report.photos.first() if obj.found_report else None) or obj.missing_photo
        return self._resolve_photo_url(photo_obj)