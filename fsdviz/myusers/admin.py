"""Modify the admin to use our CustomUser"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserChangeForm, CustomUserCreationForm
from .models import CustomUser


class CustomUserAdmin(UserAdmin):

    addform = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = [
        "email",
        "first_name",
        "last_name",
        "agency",
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
    ]

    fieldsets = UserAdmin.fieldsets + (
        (
            None,
            {
                "fields": ("role", "agency", "lakes"),
            },
        ),
    )

    list_select_related = ["agency",]



admin.site.register(CustomUser, CustomUserAdmin)
