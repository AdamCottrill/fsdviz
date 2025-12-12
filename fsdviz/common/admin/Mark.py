from django.contrib.gis import admin
from django.db.models import Count
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
        "event_count"
    )
    list_filter = ("mark_type",)
    search_fields = ("description", "mark_code")

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def event_count(self, obj):
        return obj._event_count

    def get_queryset(self, request):
        qs = super(MarkModelAdmin, self).get_queryset(request)
        qs = qs.annotate(
            _event_count=Count("stocking_events", distinct=True),
          )
        return qs.distinct()
