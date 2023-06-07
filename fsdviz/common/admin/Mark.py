from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import Mark

admin.site.empty_value_display = "(None)"


@admin.register(Mark)
class MarkModelAdmin(admin.ModelAdmin):
    list_display = (
        "mark_code",
        "mark_type",
        "clip_code",
        "description",
        "modified_timestamp",
    )
    list_filter = ("mark_type",)
    search_fields = ("description", "mark_code")
