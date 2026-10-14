import os
import requests
from __future__ import annotations
try:
    # pyrefly: ignore [missing-import]
    import face_recognition
except ImportError:
    face_recognition = None
import logging
# pyrefly: ignore [missing-import]
import cv2
from typing import Optional
import numpy as np
from django.conf import settings
from django.db import connection, transaction

logger = logging.getLogger(__name__)


def get_face_encoding(image_url: str) -> Optional[list]:
    """Get a face encoding from the Modal API."""

    api_url = os.environ["FACE_MATCH_API_URL"]
    api_key = os.environ["FACE_MATCH_API_KEY"]

    response = requests.post(
        api_url,
        headers={
            "Authorization": f"Bearer {api_key}",
        },
        json={"image_url": image_url},
        timeout=90,
    )

    response.raise_for_status()
    result = response.json()

    return result["encoding"]


MATCH_TOLERANCE: float = getattr(settings, "FACE_MATCH_TOLERANCE", 0.58)
# ALGORITHM_VERSION = "opencv_dct_v1" if face_recognition is None else "face_recognition_v1"
ALGORITHM_VERSION = "face_recognition_v1"

_FRONTAL_CASCADE = None
_PROFILE_CASCADE = None


def _vector_storage_available() -> bool:
    """Return whether the installed database schema supports pgvector queries."""
    if connection.vendor != "postgresql":
        return False

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT udt_name
                FROM information_schema.columns
                WHERE table_name = %s AND column_name = %s
                """,
                ["reports_reportphoto", "face_encoding"],
            )
            column = cursor.fetchone()
    except Exception as exc:
        logger.warning("Could not inspect face encoding column type: %s", exc)
        return False

    return bool(column and column[0] == "vector")

def _get_cascades():
    global _FRONTAL_CASCADE, _PROFILE_CASCADE
    if _FRONTAL_CASCADE is None:
        _FRONTAL_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        _PROFILE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
    return _FRONTAL_CASCADE, _PROFILE_CASCADE


def extract_face_encoding(image_path: str) -> Optional[list]:
    """
    Load an image from disk and return its 128-d face encoding as a plain list,
    or None if no usable face is detected.
    """
    if face_recognition is not None:
        try:
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)
            if encodings:
                return encodings[0].tolist()
        except Exception as exc:
            logger.warning("dlib face_recognition error: %s, falling back to cv2", exc)

    try:
        frontal, profile = _get_cascades()
        img = cv2.imread(image_path)
        if img is None:
            return None
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        faces = frontal.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))
        if len(faces) == 0:
            faces = profile.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))

        if len(faces) == 0:
            logger.info("No face detected in %s", image_path)
            return None

        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        x, y, w, h = faces[0]

        pad_x = int(w * 0.1)
        pad_y = int(h * 0.1)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(gray.shape[1], x + w + pad_x)
        y2 = min(gray.shape[0], y + h + pad_y)

        face_roi = gray[y1:y2, x1:x2]
        face_eq = cv2.equalizeHist(face_roi)
        face_resized = cv2.resize(face_eq, (64, 64))

        dct = cv2.dct(np.float32(face_resized))
        vec = dct[:16, :8].flatten().astype(float)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()
    except Exception as exc:
        logger.exception("Failed to load / encode image with cv2 %s: %s", image_path, exc)
        return None


def face_distance(encoding_a: list, encoding_b: list) -> float:
    """Compute L2 distance between two 128-d face encodings."""
    a = np.asarray(encoding_a, dtype=float)
    b = np.asarray(encoding_b, dtype=float)
    return float(np.linalg.norm(a - b))


def _notify_for_match(match) -> None:
    """
    Create in-app notifications for both report owners when a new match is created.
    Silently skips users who are the same person (edge case).
    """
    from notifications.models import Notification

    missing_owner = match.missing_report.created_by
    Notification.objects.create(
        recipient         = missing_owner,
        notification_type = Notification.NotificationType.NEW_MATCH,
        title             = "Potential match found",
        message           = (
            f"A potential facial match was found between your missing-person report "
            f"(#{match.missing_report_id}) and a sighting report (#{match.found_report_id}). "
            "This is a candidate result — please verify before drawing conclusions."
        ),
        related_report = match.missing_report,
        related_match  = match,
    )

    found_owner = match.found_report.created_by
    if found_owner.pk != missing_owner.pk:
        Notification.objects.create(
            recipient         = found_owner,
            notification_type = Notification.NotificationType.NEW_MATCH,
            title             = "Your sighting report matched",
            message           = (
                f"Your sighting report (#{match.found_report_id}) has been matched "
                "with a missing-person report. A coordinator will review it shortly."
            ),
            related_report = match.found_report,
            related_match  = match,
        )


def _search_candidates(new_encoding: list, opposite_kind: str) -> list[tuple]:
    """
    Compare new_encoding against all active photos of opposite_kind.
    Returns a list of (distance, ReportPhoto) tuples under the tolerance,
    sorted ascending by distance (best match first).
    """
    from reports.models import ReportPhoto

    photos = ReportPhoto.objects.filter(
        report__kind=opposite_kind,
        report__is_active=True,
        face_encoding__isnull=False,
    ).select_related("report", "report__created_by")

    if _vector_storage_available():
        from pgvector.django import L2Distance

        photos = (
            photos
            .annotate(distance=L2Distance("face_encoding", new_encoding))
            .filter(distance__lte=MATCH_TOLERANCE)
            .order_by("distance")
        )
        return [(float(photo.distance), photo) for photo in photos]

    candidates = []
    for photo in photos:
        try:
            distance = face_distance(new_encoding, photo.face_encoding)
        except (TypeError, ValueError):
            logger.warning("Skipping invalid face encoding for photo #%d", photo.pk)
            continue
        if distance <= MATCH_TOLERANCE:
            candidates.append((distance, photo))

    candidates.sort(key=lambda item: item[0])
    return candidates


def _search_similar_missing_photos(report_id: int, encoding: list) -> list[tuple]:
    """Find earlier missing reports using pgvector or the JSON fallback."""
    from reports.models import PersonReport, ReportPhoto

    photos = (
        ReportPhoto.objects
        .filter(
            report__kind=PersonReport.Kind.MISSING,
            report__is_active=True,
            report_id__lt=report_id,
            face_encoding__isnull=False,
        )
        .select_related("report")
    )

    if _vector_storage_available():
        from pgvector.django import L2Distance

        photos = (
            photos
            .annotate(distance=L2Distance("face_encoding", encoding))
            .filter(distance__lte=MATCH_TOLERANCE)
            .order_by("distance")[:50]
        )
        return [(float(photo.distance), photo) for photo in photos]

    candidates = []
    for photo in photos:
        try:
            distance = face_distance(encoding, photo.face_encoding)
        except (TypeError, ValueError):
            logger.warning("Skipping invalid face encoding for photo #%d", photo.pk)
            continue
        if distance <= MATCH_TOLERANCE:
            candidates.append((distance, photo))

    candidates.sort(key=lambda item: item[0])
    return candidates[:50]


@transaction.atomic
def _create_or_skip_match(
    missing_report,
    found_report,
    missing_photo,
    found_photo,
    distance: float,
) -> tuple:
    """
    Upsert a FaceMatch record. Returns (match, created).
    Prevents duplicate records via the unique constraint on (missing, found).
    """
    from matching.models import FaceMatch

    match, created = FaceMatch.objects.get_or_create(
        missing_report=missing_report,
        found_report=found_report,
        defaults={
            "missing_photo":     missing_photo,
            "found_photo":       found_photo,
            "face_distance":     distance,
            "algorithm_version": ALGORITHM_VERSION,
        },
    )
    return match, created


# ═════════════════════════════════════════════════════════════════════════════
# Main entry point: called after a photo is uploaded
# ═════════════════════════════════════════════════════════════════════════════

def save_photo_and_match(report, uploaded_file):
    """
    1. Save the uploaded file as a ReportPhoto.
    2. Generate a face encoding if face_recognition is available.
    3. Search for candidates in the opposite kind.
    4. Persist match records and trigger notifications.

    Returns the saved ReportPhoto instance.
    """
    from reports.models import ReportPhoto, PersonReport

    photo = ReportPhoto.objects.create(
        report=report,
        photo=uploaded_file,
        processing_status=ReportPhoto.ProcessingStatus.PENDING,
    )

    try:
        encoding = get_face_encoding(photo.photo.url)
    except Exception as exc:
        photo.processing_status = ReportPhoto.ProcessingStatus.ERROR
        photo.save(update_fields=["processing_status"])
        logger.exception("Error encoding photo #%d: %s", photo.pk, exc)
        return photo

    if encoding is None:
        photo.processing_status = ReportPhoto.ProcessingStatus.NO_FACE
        photo.save(update_fields=["processing_status"])
        logger.info("Photo #%d uploaded: no face detected.", photo.pk)
        return photo

    photo.face_encoding      = encoding
    photo.processing_status  = ReportPhoto.ProcessingStatus.PROCESSED
    photo.save(update_fields=["face_encoding", "processing_status"])

    if report.kind == "MISSING":
        _create_similar_missing_matches(report, photo, encoding)

    # Update report status to PROCESSING while we search
    report.status = PersonReport.Status.PROCESSING
    report.save(update_fields=["status"])

    opposite_kind = "FOUND" if report.kind == "MISSING" else "MISSING"
    candidates    = _search_candidates(encoding, opposite_kind)

    new_matches_created = 0

    for distance, candidate_photo in candidates:
        # Assign missing/found roles correctly
        if report.kind == "MISSING":
            missing_report, found_report   = report, candidate_photo.report
            missing_photo_obj, found_photo_obj = photo, candidate_photo
        else:
            missing_report, found_report   = candidate_photo.report, report
            missing_photo_obj, found_photo_obj = candidate_photo, photo

        match, created = _create_or_skip_match(
            missing_report=missing_report,
            found_report=found_report,
            missing_photo=missing_photo_obj,
            found_photo=found_photo_obj,
            distance=distance,
        )

        if created:
            new_matches_created += 1
            _notify_for_match(match)

    # Update report status based on whether new matches were found
    if new_matches_created > 0:
        report.status = PersonReport.Status.POTENTIAL_MATCH
    else:
        report.status = PersonReport.Status.SUBMITTED
    report.save(update_fields=["status"])

    logger.info(
        "Photo #%d processed for report #%d (%s). "
        "%d new match(es) created.",
        photo.pk, report.pk, report.kind, new_matches_created,
    )

    return photo


def _create_similar_missing_matches(report, photo, encoding):
    """Persist new missing-report candidates against earlier missing reports."""
    from reports.models import SimilarReportMatch

    candidates = _search_similar_missing_photos(report.pk, encoding)

    for distance, candidate_photo in candidates:
        SimilarReportMatch.objects.get_or_create(
            report_low=candidate_photo.report,
            report_high=report,
            defaults={
                "source_photo": candidate_photo,
                "matched_photo": photo,
                "face_distance": distance,
            },
        )