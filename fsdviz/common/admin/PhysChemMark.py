from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import PhysChemMark

admin.site.empty_value_display = "(None)"


@admin.register(PhysChemMark)
class PhysChemMarkModelAdmin(admin.ModelAdmin):
    list_display = ("mark_code", "mark_type", "description", "fill_color")
    list_filter = ("mark_type",)
    search_fields = (
        "mark_code",
        "description",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
