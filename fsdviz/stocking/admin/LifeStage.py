from django.contrib import admin
from django.db.models import Count

from fsdviz.common.admin.utils import fill_color_widget
from ..models import LifeStage

admin.site.empty_value_display = "(None)"


@admin.register(LifeStage)
class LifeStageModelAdmin(admin.ModelAdmin):
    list_display = (
        "abbrev",
        "description",
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
        qs = super(LifeStageModelAdmin, self).get_queryset(request)
        qs = qs.annotate(
            _event_count=Count("stocking_events", distinct=True),
          )
        return qs.distinct()
