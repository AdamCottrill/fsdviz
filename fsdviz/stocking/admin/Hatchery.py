from django.contrib import admin

from ..models import Hatchery


admin.site.empty_value_display = "(None)"


@admin.register(Hatchery)
class HatcheryModelAdmin(admin.ModelAdmin):
    list_display = (
        "hatchery_name",
        "abbrev",
        "hatchery_type",
        "agency",
        "active",
        "modified_timestamp",
    )
    list_select_related = ("agency",)
    list_filter = (
        "active",
        "hatchery_type",
        "agency",
    )
    search_fields = ["hatchery_name", "abbrev"]
    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )
