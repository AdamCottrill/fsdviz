from django.contrib.gis import admin
from django.db.models import Count

from .utils import fill_color_widget
from ..models import Agency


@admin.register(Agency)
class AgencyModelAdmin(admin.ModelAdmin):
    list_display = (
        "agency_name",
        "abbrev",
        "fill_color",
        "modified_timestamp",
        "event_count"
    )
    search_fields = ("agency_name", "abbrev")

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)

    def event_count(self, obj):
        return obj._event_count

    def get_queryset(self, request):
        qs = super(AgencyModelAdmin, self).get_queryset(request)
        qs = qs.annotate(
            _event_count=Count("stocking_events", distinct=True),
          )
        return qs.distinct()
