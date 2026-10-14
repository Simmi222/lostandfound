from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom user model.  AUTH_USER_MODEL = 'Accounts.User'

    Roles are enforced server-side; the frontend must never be trusted
    to self-assign ADMIN privilege.
    """

    class Role(models.TextChoices):
        RELATIVE    = "RELATIVE",    "Relative"
        CONTRIBUTOR = "CONTRIBUTOR", "Contributor"
        ADMIN       = "ADMIN",       "Admin"

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=15,
        choices=Role.choices,
        default=Role.RELATIVE,
    )

    phone_number = models.CharField(max_length=20, blank=True)

    # Use username as the login identifier. Email remains unique contact data.
    USERNAME_FIELD  = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_relative(self):
        return self.role == self.Role.RELATIVE

    @property
    def is_contributor(self):
        return self.role == self.Role.CONTRIBUTOR

    @property
    def is_platform_admin(self):
        return self.role == self.Role.ADMIN or self.is_staff