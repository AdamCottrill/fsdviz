from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import Strain

admin.site.empty_value_display = "(None)"


@admin.register(Strain)
class StrainModelAdmin(admin.ModelAdmin):
    list_display = (
        "strain_code",
        "strain_species",
        "strain_label",
        "active",
        "fill_color",
    )
    # list_select_related = ('strain_species',)
    list_filter = ("active", "strain_species", "strain_code")
    search_fields = ("strain_label", "strain_code")

    def get_queryset(self, request):
        qs = super(StrainModelAdmin, self).get_queryset(request)
        return qs.distinct()

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
