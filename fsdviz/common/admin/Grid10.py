from django.contrib.gis import admin

from ..models import Grid10

admin.site.empty_value_display = "(None)"


@admin.register(Grid10)
class Grid10Admin(admin.GeoModelAdmin):
    list_display = (
        "grid",
        "lake",
        "slug",
        "modified_timestamp",
    )
    list_filter = ("lake",)
    search_fields = ("grid",)
