from rest_framework.permissions import BasePermission


class IsRelative(BasePermission):
    """Allow access only to users with the RELATIVE role."""

    message = "Only relatives can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "RELATIVE"
        )


class IsContributor(BasePermission):
    """Allow access only to users with the CONTRIBUTOR role."""

    message = "Only contributors can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "CONTRIBUTOR"
        )


class IsRelativeOrContributor(BasePermission):
    """Allow any authenticated RELATIVE or CONTRIBUTOR."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in {"RELATIVE", "CONTRIBUTOR"}
        )


class IsPlatformAdmin(BasePermission):
    """Allow access only to ADMIN-role or staff users."""

    message = "Admin access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == "ADMIN" or request.user.is_staff
