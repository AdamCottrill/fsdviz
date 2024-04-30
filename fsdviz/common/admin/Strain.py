from django.contrib.gis import admin
from django.db.models import Count
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
        "modified_timestamp",
        "event_count"
    )
    # list_select_related = ('strain_species',)
    list_filter = ("active", "strain_species", "strain_code")
    search_fields = ("strain_label", "strain_code")

    readonly_fields = (
        "slug",
        "created_timestamp",
        "modified_timestamp",
    )

    def event_count(self, obj):
        return obj._event_count


    def get_queryset(self, request):
        qs = super(StrainModelAdmin, self).get_queryset(request)
        qs = qs.annotate(
            _event_count=Count("rawstrain__stocking_events", distinct=True),
          )
        return qs.distinct()

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
