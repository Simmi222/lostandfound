from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsReportOwner(BasePermission):
    """
    Object-level permission: allow the report's creator to read/edit.
    Read-only for authenticated staff / admins.
    """

    message = "You do not have permission to modify this report."

    def has_object_permission(self, request, view, obj):
        if request.user and (request.user.is_staff or request.user.role == "ADMIN"):
            return True
        if request.method in SAFE_METHODS:
            return obj.created_by == request.user
        return obj.created_by == request.user
