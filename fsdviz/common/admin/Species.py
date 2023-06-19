from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import Species

admin.site.empty_value_display = "(None)"


@admin.register(Species)
class SpeciesModelAdmin(admin.ModelAdmin):
    list_display = (
        "abbrev",
        "common_name",
        "scientific_name",
        "active",
        "fill_color",
        "modified_timestamp",
    )
    search_fields = ["abbrev", "common_name"]
    list_filter = [
        "active",
    ]

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
