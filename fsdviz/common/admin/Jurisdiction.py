from django.contrib.gis import admin

from .utils import fill_color_widget
from ..models import Jurisdiction

admin.site.empty_value_display = "(None)"


@admin.register(Jurisdiction)
class JurisdictionModelAdmin(admin.GeoModelAdmin):
    list_display = (
        "name",
        "lake",
        "stateprov",
        "description",
        "fill_color",
        "modified_timestamp",
    )
    list_filter = ("lake", "stateprov")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
