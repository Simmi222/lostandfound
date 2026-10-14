from django.contrib import admin
from .models import FaceMatch


@admin.register(FaceMatch)
class FaceMatchAdmin(admin.ModelAdmin):
    list_display  = (
        "id", "missing_report", "found_report",
        "face_distance", "review_status", "reviewed_by", "created_at",
    )
    list_filter   = ("review_status",)
    search_fields = (
        "missing_report__name", "found_report__name",
        "reviewed_by__email",
    )
    ordering      = ("face_distance",)
    raw_id_fields = (
        "missing_report", "found_report",
        "missing_photo", "found_photo", "reviewed_by",
    )
    readonly_fields = ("face_distance", "algorithm_version", "created_at")
