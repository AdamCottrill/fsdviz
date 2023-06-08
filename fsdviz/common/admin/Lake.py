from django.contrib.gis import admin

from .utils import fill_color_widget
from ..models import Lake

admin.site.empty_value_display = "(None)"


@admin.register(Lake)
class LakeModelAdmin(admin.GeoModelAdmin):
    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    list_display = (
        "lake_name",
        "abbrev",
        "fill_color",
        "modified_timestamp",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
