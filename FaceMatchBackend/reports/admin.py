from django.contrib import admin
from .models import PersonReport, ReportPhoto


@admin.register(PersonReport)
class PersonReportAdmin(admin.ModelAdmin):
    list_display  = ("id", "kind", "status", "name", "created_by", "created_at")
    list_filter   = ("kind", "status", "is_active")
    search_fields = ("name", "description", "last_seen_place")
    ordering      = ("-created_at",)
    raw_id_fields = ("created_by",)


@admin.register(ReportPhoto)
class ReportPhotoAdmin(admin.ModelAdmin):
    list_display  = ("id", "report", "processing_status", "uploaded_at")
    list_filter   = ("processing_status",)
    ordering      = ("-uploaded_at",)
