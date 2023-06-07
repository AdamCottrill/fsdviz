from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import CompositeFinClip


admin.site.empty_value_display = "(None)"


@admin.register(CompositeFinClip)
class CompositeFinClipModelAdmin(admin.ModelAdmin):
    list_display = (
        "clip_code",
        "description",
        "fill_color",
        "modified_timestamp",
    )
    list_filter = ("clip_code",)
    search_fields = ("clip_code", "description")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
