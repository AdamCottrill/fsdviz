from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import LatLonFlag

admin.site.empty_value_display = "(None)"


@admin.register(LatLonFlag)
class LatLonFlagModelAdmin(admin.ModelAdmin):
    list_display = ("value", "description")
