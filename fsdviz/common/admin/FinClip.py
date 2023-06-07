from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import FinClip

admin.site.empty_value_display = "(None)"


@admin.register(FinClip)
class FinClipModelAdmin(admin.ModelAdmin):
    list_display = ("abbrev", "description", "fill_color")
    list_filter = ("abbrev",)
    search_fields = ("abbrev", "description")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
