from django.contrib import admin
from django.db.models import Count

from ..models import Hatchery


admin.site.empty_value_display = "(None)"


@admin.register(Hatchery)
class HatcheryModelAdmin(admin.ModelAdmin):
    list_display = (
        "hatchery_name",
        "abbrev",
        "hatchery_type",
        "agency",
        "active",
        "modified_timestamp",
        "event_count"
    )
    list_select_related = ("agency",)
    list_filter = (
        "active",
        "hatchery_type",
        "agency",
    )
    search_fields = ["hatchery_name", "abbrev"]
    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )


    def event_count(self, obj):
        return obj._event_count

    def get_queryset(self, request):
        qs = super(HatcheryModelAdmin, self).get_queryset(request)
        qs = qs.annotate(
            _event_count=Count("stocking_events", distinct=True),
          )
        return qs.distinct()
