from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ("id", "recipient", "notification_type", "title", "is_read", "created_at")
    list_filter   = ("notification_type", "is_read")
    search_fields = ("recipient__email", "title", "message")
    ordering      = ("-created_at",)
    raw_id_fields = ("recipient", "related_report", "related_match")
