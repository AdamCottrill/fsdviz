from django.contrib import admin

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
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
