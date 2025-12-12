from django.contrib import admin
from django.db.models import Count

from ..models import DataUploadEvent

admin.site.empty_value_display = "(None)"


@admin.register(DataUploadEvent)
class DataUploadEventModelAdmin(admin.ModelAdmin):
    list_display = ("id", "timestamp", "uploaded_by", "agency", "lake", "event_count")
    list_filter = ("lake", "agency", "uploaded_by")

    date_hierarchy = "timestamp"

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
        "slug"
    )

    ordering = ("-timestamp",)

    def event_count(self, obj):
        return obj._event_count

    def get_queryset(self, request):
        qs = super(DataUploadEventModelAdmin, self).get_queryset(request)

        qs = qs.select_related(
            "lake",
            "uploaded_by",
            "agency"
        ).prefetch_related(
            "stocking_events",
            "stocking_events__agency",
            "stocking_events__species",
            "stocking_events__strain_alias",
            "stocking_events__strain_alias__strain",
            "stocking_events__lifestage",
            "stocking_events__stocking_method",
            "stocking_events__clip_code",
        ).defer("lake__geom").annotate(
            _event_count=Count("stocking_events", distinct=True),
        )
        return qs.distinct()
