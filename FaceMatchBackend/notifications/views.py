from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/

    Returns all notifications for the authenticated user,
    ordered newest first.
    """
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Notification.objects
            .filter(recipient=self.request.user)
            .select_related("related_report", "related_match")
            .order_by("-created_at")
        )


class NotificationReadView(APIView):
    """
    POST /api/notifications/{id}/read/

    Marks a single notification as read.  The recipient must be the
    authenticated user — other users cannot mark someone else's notification.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(
                pk=pk,
                recipient=request.user,
            )
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"id": pk, "is_read": True})


class NotificationReadAllView(APIView):
    """
    POST /api/notifications/read-all/

    Marks all of the caller's unread notifications as read in bulk.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response({"marked_read": updated})
