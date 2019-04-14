"""Custom managers for our customuser objects

from:
https://www.linkedin.com/pulse/django-2-register-authenticate-users-email-george-bikas/
f
"""

from django.contrib.auth.models import BaseUserManager


class CustomUserManager(BaseUserManager):
    """over-riding baseUserManager to allow users to register with
    email."""

    def create_user(self, email, password=None, **kwargs):

        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)
        user = self.model(email=email, **kwargs)
        user.set_password(password)
        user.save()

        return user

    def create_superuser(self, email, password, **extra_fields):

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(email, password, **extra_fields)
