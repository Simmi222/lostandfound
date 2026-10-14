from django.conf import settings
from django.db import models


class MissingPerson(models.Model):
    """Legacy model — superseded by reports.PersonReport. Kept for data migration."""

    GENDER_CHOICES = [
        ('male',   'Male'),
        ('female', 'Female'),
    ]

    name              = models.CharField(max_length=50)
    gender            = models.CharField(choices=GENDER_CHOICES, max_length=10)
    age               = models.PositiveSmallIntegerField()
    colour            = models.CharField(max_length=100)
    height            = models.CharField(max_length=100)
    last_seen_place   = models.CharField(max_length=100)
    disability        = models.CharField(max_length=100)
    special_bodymark  = models.CharField(max_length=100)
    relative_name     = models.CharField(max_length=100)
    description       = models.TextField()
    address           = models.TextField()
    lost_date         = models.DateField()
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class MissingPersonFace(models.Model):
    missing_person = models.ForeignKey(
        MissingPerson,
        on_delete=models.CASCADE,
        related_name="faces",
    )
    photo         = models.ImageField(upload_to="missing_person_faces/")
    face_encoding = models.JSONField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Face - {self.missing_person.name}"


class RelativeDetail(models.Model):
    missingperson = models.ForeignKey(
        MissingPerson,
        on_delete=models.CASCADE,
        related_name="relative_details",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="relative_details",
    )
    relative_name = models.CharField(max_length=100)
    relation      = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=15)
    address       = models.TextField()
    id_proof      = models.CharField(max_length=100)

    def __str__(self):
        return self.relative_name