from django.contrib.gis import admin
from django.db.models import Count

from .utils import fill_color_widget
from ..models import StateProvince

admin.site.empty_value_display = "(None)"


@admin.register(StateProvince)
class StateProvinceModelAdmin(admin.GISModelAdmin):
    list_display = (
        "name",
        "abbrev",
        "country",
        "fill_color",
        "modified_timestamp",
        "event_count"
    )

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)

    def event_count(self, obj):
        return obj._event_count

    def get_queryset(self, request):
        queryset = super().get_queryset(request)

        queryset = queryset.annotate(
            _event_count=Count("jurisdiction__stocking_events", distinct=True),
        )

        return queryset.distinct()
