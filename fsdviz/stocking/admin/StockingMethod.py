from django.contrib import admin

from fsdviz.common.admin.utils import fill_color_widget
from ..models import StockingMethod

admin.site.empty_value_display = "(None)"


@admin.register(StockingMethod)
class StockingMethodModelAdmin(admin.ModelAdmin):
    list_display = (
        "stk_meth",
        "description",
        "fill_color",
        "modified_timestamp",
    )
    search_fields = ("stk_meth", "description")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
