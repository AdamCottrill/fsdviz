from django.contrib.gis import admin

from .utils import fill_color_widget
from ..models import Agency


@admin.register(Agency)
class AgencyModelAdmin(admin.ModelAdmin):
    list_display = (
        "agency_name",
        "abbrev",
        "fill_color",
        "modified_timestamp",
    )
    search_fields = ("agency_name", "abbrev")

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
