"""Model for our custome user class"""

from django.db import models
from django.contrib.auth.models import AbstractUser

from fsdviz.common.models import Lake, Agency

from .managers import CustomUserManager


class CustomUser(AbstractUser):
    """A custom user based on django's AbstractUser."""

    GREAT_LAKES_COORDINATOR = "glsc"
    AGENCY_MANAGER = "am"
    AGENCY_COORDINATOR = "asc"
    AGENCY_USER = "au"

    USER_ROLE_CHOICES = [
        (GREAT_LAKES_COORDINATOR, "Great Lakes Stocking Coordinator"),
        (AGENCY_MANAGER, "Agency Manager"),
        (AGENCY_COORDINATOR, "Agency Stocking Coordinator"),
        (AGENCY_USER, "Agency User"),
    ]

    username = models.CharField(max_length=40, unique=False, default="")
    email = models.EmailField("Email address", unique=True)

    role = models.CharField(
        max_length=4, choices=USER_ROLE_CHOICES, default=AGENCY_USER
    )

    # each user can be associated with a single agency
    # and can be assocaited with one or more lakes
    agency = models.ForeignKey(Agency, blank=True, null=True, on_delete=models.CASCADE)
    lakes = models.ManyToManyField(Lake)

    REQUIRED_FIELDS = ["first_name", "last_name"]
    USERNAME_FIELD = "email"

    objects = CustomUserManager()

    class Meta(object):
        verbose_name = "user"
        verbose_name_plural = "users"

    def save(self, *args, **kwargs):
        self.email = self.email.lower()
        return super(CustomUser, self).save(*args, **kwargs)

    def __str__(self):
        """the User's e-mail will be the string representation.

        Arguments:
        - `self`:
        """
        return self.email

    def fullname(self):
        """the full name of a user will be their first name
        followed by their last name separated by a space.

        e.g. bart simpson should be 'Bart Simpson'
        """

        first = self.first_name.title()
        last = self.last_name.title()

        return "{} {}".format(first, last)

    def shortname(self):
        """the short name of a user will be their first initial,
        followed by a period, a space, and finally their last name.

        e.g. bart simpson should be 'B. Simpson'

        """

        initial = self.first_name.title()[0]
        last = self.last_name.title()

        return "{}. {}".format(initial, last)
