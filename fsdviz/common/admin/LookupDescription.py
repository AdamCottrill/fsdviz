from django.contrib import admin
from ..models import LookupDescription


@admin.register(LookupDescription)
class LookupDescriptionModelAdmin(admin.ModelAdmin):

    list_display = ["model_name", "slug", "created_timestamp"]
    search_fields = ["model_name", "slug"]
    readonly_fields = [
        "slug",
    ]
