# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import PersonReport, ReportPhoto, SimilarReportMatch


class ReportPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ReportPhoto
        fields = ["id", "photo", "processing_status", "uploaded_at"]
        read_only_fields = ["id", "processing_status", "uploaded_at"]


class PersonReportSerializer(serializers.ModelSerializer):
    """
    Full serializer used for CREATE and READ operations.

    On write, accepts an optional `images` list of uploaded files.
    Each image is processed for face encoding after the report is saved.
    """

    photos  = ReportPhotoSerializer(many=True, read_only=True)

    # Write-only: multipart image uploads
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
    )

    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True
    )

    class Meta:
        model = PersonReport
        fields = [
            "id",
            "kind",
            "status",
            "name",
            "gender",
            "age",
            "colour",
            "height",
            "last_seen_place",
            "lost_or_found_date",
            "disability",
            "special_bodymark",
            "description",
            "address",
            "circumstances",
            "photos",
            "images",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_by", "created_by_username",
                            "created_at", "updated_at"]
        extra_kwargs = {
            "kind": {"required": False},
        }

    def create(self, validated_data):
        # Lazy import to avoid circular dependency with matching.services
        from matching.services import save_photo_and_match

        images = validated_data.pop("images", [])
        report = PersonReport.objects.create(
            created_by=self.context["request"].user,
            **validated_data,
        )
        errors = []
        for image in images:
            try:
                photo = save_photo_and_match(report, image)
                if photo.processing_status == "NO_FACE":
                    errors.append("Photo saved. No clear face detected for AI matching.")
            except Exception as exc:
                errors.append(str(exc))
        # Surface face-detection warnings without aborting the report.
        if errors:
            report._face_warnings = errors
        return report

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Attach any face-detection warnings generated during create().
        if hasattr(instance, "_face_warnings"):
            data["face_warnings"] = instance._face_warnings
        return data


class PersonReportUpdateSerializer(serializers.ModelSerializer):
    """
    Used for PATCH operations — limited fields; status cannot be freely set.
    """
    class Meta:
        model = PersonReport
        fields = [
            "name", "gender", "age", "colour", "height",
            "last_seen_place", "lost_or_found_date",
            "disability", "special_bodymark",
            "description", "address", "circumstances",
            "contact_name", "contact_phone",
        ]


class ReportPhotoUploadSerializer(serializers.Serializer):
    """Used for POST /reports/{id}/photos/"""
    photos = serializers.ListField(
        child=serializers.ImageField(),
        min_length=1,
    )


class SimilarReportMatchSerializer(serializers.ModelSerializer):
    report_summary = serializers.SerializerMethodField()
    matched_report_summary = serializers.SerializerMethodField()

    class Meta:
        model = SimilarReportMatch
        fields = [
            "id",
            "report_low",
            "report_high",
            "report_summary",
            "matched_report_summary",
            "source_photo",
            "matched_photo",
            "face_distance",
            "review_status",
            "created_at",
        ]
        read_only_fields = fields

    def _summary(self, report):
        first_photo = report.photos.first()
        photo_url = None
        if first_photo and first_photo.photo:
            url = first_photo.photo.url
            request = self.context.get("request")
            if request:
                photo_url = request.build_absolute_uri(url)
            elif not url.startswith("http"):
                photo_url = f"http://127.0.0.1:8000{url}"
            else:
                photo_url = url
        return {
            "id": report.pk,
            "name": report.name or "Unknown",
            "age": report.age,
            "last_seen_place": report.last_seen_place,
            "description": report.description[:200] if report.description else "",
            "photo_url": photo_url,
        }

    def get_report_summary(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and obj.report_high.created_by_id == user.pk:
            return self._summary(obj.report_high)
        return self._summary(obj.report_low)

    def get_matched_report_summary(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and obj.report_high.created_by_id == user.pk:
            return self._summary(obj.report_low)
        return self._summary(obj.report_high)