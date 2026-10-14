from django.conf import settings
from django.db import models
from pgvector.django import HnswIndex, VectorField


class PersonReport(models.Model):
    """
    Unified report model for both MISSING and FOUND/SIGHTED persons.

    A RELATIVE creates a MISSING report.
    A CONTRIBUTOR creates a FOUND report.
    """

    class Kind(models.TextChoices):
        MISSING = "MISSING", "Missing Person"
        FOUND   = "FOUND",   "Found / Sighted Person"

    class Status(models.TextChoices):
        SUBMITTED       = "SUBMITTED",       "Submitted"
        PROCESSING      = "PROCESSING",      "Processing"
        POTENTIAL_MATCH = "POTENTIAL_MATCH", "Potential Match Found"
        UNDER_REVIEW    = "UNDER_REVIEW",    "Under Review"
        VERIFIED        = "VERIFIED",        "Verified Match"
        RESOLVED        = "RESOLVED",        "Resolved / Found"
        CLOSED          = "CLOSED",          "Closed"

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports",
    )

    kind = models.CharField(max_length=10, choices=Kind.choices)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED,
    )

    name         = models.CharField(max_length=120, blank=True)
    gender       = models.CharField(max_length=20,  blank=True)
    age          = models.PositiveSmallIntegerField(null=True, blank=True)
    colour       = models.CharField(max_length=100, blank=True)   # skin/hair
    height       = models.CharField(max_length=100, blank=True)

    last_seen_place    = models.CharField(max_length=255, blank=True)
    lost_or_found_date = models.DateField(null=True, blank=True)

    disability         = models.CharField(max_length=255, blank=True)
    special_bodymark   = models.CharField(max_length=255, blank=True)
    description        = models.TextField(blank=True)
    address            = models.TextField(blank=True)
    circumstances      = models.TextField(blank=True)   # for FOUND reports

    contact_name  = models.CharField(max_length=120, blank=True)
    contact_phone = models.CharField(max_length=20,  blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.kind}: {self.name or 'Unknown'} (#{self.pk})"


class ReportPhoto(models.Model):
    """
    One photograph attached to a PersonReport.
    The face_encoding stores a 128-d face vector in PostgreSQL.
    A NULL encoding means processing is pending or failed.
    """

    class ProcessingStatus(models.TextChoices):
        PENDING   = "PENDING",   "Pending"
        PROCESSED = "PROCESSED", "Processed"
        NO_FACE   = "NO_FACE",   "No Face Detected"
        ERROR     = "ERROR",     "Processing Error"

    report = models.ForeignKey(
        PersonReport,
        on_delete=models.CASCADE,
        related_name="photos",
    )

    photo = models.ImageField(upload_to="report_photos/%Y/%m/")

    face_encoding = VectorField(
        dimensions=128,
        null=True,
        blank=True,
    )

    processing_status = models.CharField(
        max_length=10,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]
        indexes = [
            HnswIndex(
                name="report_photo_face_hnsw",
                fields=["face_encoding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_l2_ops"],
            ),
        ]

    def __str__(self):
        return f"Photo #{self.pk} for Report #{self.report_id}"


class SimilarReportMatch(models.Model):
    """A candidate match between two active missing-person reports."""

    class ReviewStatus(models.TextChoices):
        POTENTIAL = "POTENTIAL", "Potential Match"
        VERIFIED = "VERIFIED", "Verified Match"
        REJECTED = "REJECTED", "Rejected"

    report_low = models.ForeignKey(
        "reports.PersonReport",
        on_delete=models.CASCADE,
        related_name="similar_matches_low",
    )
    report_high = models.ForeignKey(
        "reports.PersonReport",
        on_delete=models.CASCADE,
        related_name="similar_matches_high",
    )
    source_photo = models.ForeignKey(
        "reports.ReportPhoto",
        on_delete=models.SET_NULL,
        null=True,
        related_name="similar_matches_source",
    )
    matched_photo = models.ForeignKey(
        "reports.ReportPhoto",
        on_delete=models.SET_NULL,
        null=True,
        related_name="similar_matches_matched",
    )
    face_distance = models.FloatField()
    review_status = models.CharField(
        max_length=15,
        choices=ReviewStatus.choices,
        default=ReviewStatus.POTENTIAL,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["face_distance"]
        constraints = [
            models.UniqueConstraint(
                fields=["report_low", "report_high"],
                name="unique_similar_report_pair",
            ),
            models.CheckConstraint(
                condition=models.Q(report_low__lt=models.F("report_high")),
                name="similar_report_pair_ordered",
            ),
        ]