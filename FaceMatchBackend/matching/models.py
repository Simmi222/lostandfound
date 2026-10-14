from django.conf import settings
from django.db import models


class FaceMatch(models.Model):
    """
    Represents a potential facial match between a MISSING report and a FOUND report.

    face_distance is the L2 distance between two 128-d embeddings.
    Lower distance = more similar faces.  This is NOT a probability.
    Every result must be labeled as a potential match requiring human verification.
    """

    class ReviewStatus(models.TextChoices):
        POTENTIAL    = "POTENTIAL",    "Potential Match"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        VERIFIED     = "VERIFIED",     "Verified Match"
        REJECTED     = "REJECTED",     "Rejected"

    # Always: report_a is MISSING, report_b is FOUND
    missing_report = models.ForeignKey(
        "reports.PersonReport",
        on_delete=models.CASCADE,
        related_name="matches_as_missing",
        limit_choices_to={"kind": "MISSING"},
    )

    found_report = models.ForeignKey(
        "reports.PersonReport",
        on_delete=models.CASCADE,
        related_name="matches_as_found",
        limit_choices_to={"kind": "FOUND"},
    )

    # Face photos that produced this match (nullable — may be set later)
    missing_photo = models.ForeignKey(
        "reports.ReportPhoto",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="matches_as_missing_photo",
    )

    found_photo = models.ForeignKey(
        "reports.ReportPhoto",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="matches_as_found_photo",
    )

    # Raw L2 distance — not a probability
    face_distance = models.FloatField()

    # Algorithm versioning for reproducibility
    algorithm_version = models.CharField(max_length=50, default="face_recognition_v1")

    review_status = models.CharField(
        max_length=15,
        choices=ReviewStatus.choices,
        default=ReviewStatus.POTENTIAL,
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_matches",
    )

    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["face_distance"]
        constraints = [
            models.UniqueConstraint(
                fields=["missing_report", "found_report"],
                name="unique_missing_found_pair",
            )
        ]

    def __str__(self):
        return (
            f"Match #{self.pk}: "
            f"Missing#{self.missing_report_id} ↔ Found#{self.found_report_id} "
            f"(d={self.face_distance:.4f})"
        )