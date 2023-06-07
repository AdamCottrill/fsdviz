from django.contrib.gis import admin

from .utils import fill_color_widget
from ..models import StateProvince

admin.site.empty_value_display = "(None)"


@admin.register(StateProvince)
class StateProvinceModelAdmin(admin.GeoModelAdmin):
    list_display = ("name", "abbrev", "country", "fill_color")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
