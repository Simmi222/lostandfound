from django.conf import settings
from django.db import models


class Notification(models.Model):
    """
    In-app notification sent to a user when a relevant event occurs.

    Do NOT include sensitive personal information in notification previews.
    Email / push notifications can be added in a future phase using the
    same model as a source of truth.
    """

    class NotificationType(models.TextChoices):
        NEW_MATCH         = "NEW_MATCH",         "New Potential Match"
        MATCH_VERIFIED    = "MATCH_VERIFIED",    "Match Verified"
        MATCH_REJECTED    = "MATCH_REJECTED",    "Match Rejected"
        CLARIFICATION     = "CLARIFICATION",     "Clarification Requested"
        REPORT_MODERATED  = "REPORT_MODERATED",  "Report Moderated"
        GENERAL           = "GENERAL",           "General"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )

    title   = models.CharField(max_length=200)
    message = models.TextField()

    # Optional links to related objects
    related_report = models.ForeignKey(
        "reports.PersonReport",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="notifications",
    )

    related_match = models.ForeignKey(
        "matching.FaceMatch",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="notifications",
    )

    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.notification_type}] → {self.recipient.email}: {self.title}"
