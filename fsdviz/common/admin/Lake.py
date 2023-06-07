from django.contrib.gis import admin

from .utils import fill_color_widget
from ..models import Lake

admin.site.empty_value_display = "(None)"


@admin.register(Lake)
class LakeModelAdmin(admin.GeoModelAdmin):
    list_display = ("lake_name", "abbrev", "fill_color")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
