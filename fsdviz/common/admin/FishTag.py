from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import FishTag


admin.site.empty_value_display = "(None)"


@admin.register(FishTag)
class FishTagModelAdmin(admin.ModelAdmin):
    list_display = ("tag_code", "tag_type", "tag_colour", "description", "fill_color")
    list_filter = ("tag_code", "tag_type", "tag_colour")
    search_fields = (
        "tag_code",
        "description",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
