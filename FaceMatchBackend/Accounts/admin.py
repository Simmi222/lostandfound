from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ("email", "username", "role", "is_staff", "date_joined")
    list_filter   = ("role", "is_staff", "is_active")
    search_fields = ("email", "username")
    ordering      = ("-date_joined",)

    fieldsets = UserAdmin.fieldsets + (
        ("Platform Info", {"fields": ("role", "phone_number")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Platform Info", {"fields": ("role", "phone_number", "email")}),
    )
