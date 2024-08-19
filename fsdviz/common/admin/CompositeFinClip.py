from django.contrib.gis import admin
from django.db.models import Count
from .utils import fill_color_widget
from ..models import CompositeFinClip


admin.site.empty_value_display = "(None)"


@admin.register(CompositeFinClip)
class CompositeFinClipModelAdmin(admin.ModelAdmin):
    list_display = (
        "clip_code",
        "description",
        "fill_color",
        "modified_timestamp",
        "event_count"
    )
    list_filter = ("clip_code",)
    search_fields = ("clip_code", "description")

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)

    def event_count(self, obj):
        return obj._event_count

    def get_queryset(self, request):
        qs = super(CompositeFinClipModelAdmin, self).get_queryset(request)
        qs = qs.annotate(
            _event_count=Count("stocking_events", distinct=True),
          )
        return qs.distinct()
