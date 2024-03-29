from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import FinClip

admin.site.empty_value_display = "(None)"


@admin.register(FinClip)
class FinClipModelAdmin(admin.ModelAdmin):
    list_display = (
        "abbrev",
        "description",
        "fill_color",
        "modified_timestamp",
    )
    list_filter = ("abbrev",)
    search_fields = ("abbrev", "description")

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
