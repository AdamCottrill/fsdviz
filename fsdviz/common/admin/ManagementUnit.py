from django.contrib.gis import admin

from .utils import fill_color_widget
from ..models import ManagementUnit

admin.site.empty_value_display = "(None)"


@admin.register(ManagementUnit)
class ManagementUnitModelAdmin(admin.GeoModelAdmin):
    list_display = (
        "label",
        "lake",
        "mu_type",
        "description",
        "fill_color",
        "modified_timestamp",
    )
    list_filter = ("lake", "mu_type")
    search_fields = ("label",)

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
