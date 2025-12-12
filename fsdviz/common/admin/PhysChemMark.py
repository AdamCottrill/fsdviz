from django.contrib.gis import admin
from django.db.models import Count
from .utils import fill_color_widget
from ..models import PhysChemMark

admin.site.empty_value_display = "(None)"


@admin.register(PhysChemMark)
class PhysChemMarkModelAdmin(admin.ModelAdmin):
    list_display = (
        "mark_code",
        "mark_type",
        "description",
        "fill_color",
        "modified_timestamp",
        "event_count"
    )
    list_filter = ("mark_type",)
    search_fields = (
        "mark_code",
        "description",
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
        qs = super(PhysChemMarkModelAdmin, self).get_queryset(request)
        qs = qs.annotate(
            _event_count=Count("stocking_events", distinct=True),
          )
        return qs.distinct()
