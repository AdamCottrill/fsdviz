from django.contrib import admin

from fsdviz.common.utils import fill_color_widget
from .models import (
    LifeStage,
    Condition,
    StockingMethod,
    StockingEvent,
    Hatchery,
    YearlingEquivalent,
)


admin.site.empty_value_display = "(None)"


@admin.register(LifeStage)
class LifeStageModelAdmin(admin.ModelAdmin):
    list_display = ("abbrev", "description", "fill_color")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(YearlingEquivalent)
class YearlingEquivalentModelAdmin(admin.ModelAdmin):
    list_display = ("species", "lifestage", "yreq_factor", "comment")
    list_filter = ("species", "lifestage")
    search_fields = ("species", "lifestage")

    ordering = ("species__common_name", "yreq_factor")

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ("species", "lifestage")
        else:
            return []


@admin.register(Condition)
class ConditionModelAdmin(admin.ModelAdmin):
    list_display = ("condition", "description")


@admin.register(StockingMethod)
class StockingMethodModelAdmin(admin.ModelAdmin):
    list_display = ("stk_meth", "description", "fill_color")
    search_fields = ("stk_meth", "description")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(Hatchery)
class HatcheryModelAdmin(admin.ModelAdmin):
    list_display = ("hatchery_name", "abbrev", "hatchery_type", "agency", "active")
    list_select_related = ("agency",)
    list_filter = (
        "active",
        "hatchery_type",
        "agency",
    )
    search_fields = ["hatchery_name", "abbrev"]


@admin.register(StockingEvent)
class StockingEventModelAdmin(admin.ModelAdmin):
    list_display = (
        "stock_id",
        "species",
        "agency",
        "lake",
        "stateprov",
        "year_class",
        "agemonth",
        "lifestage",
        "date",
        "site",
        "no_stocked",
    )
    list_select_related = (
        "species",
        "agency",
        "jurisdiction__lake",
        "stocking_method",
        "lifestage",
        "jurisdiction__stateprov",
    )
    list_filter = ("jurisdiction__lake", "lifestage", "species", "agency", "year")
    search_fields = ["site", "stock_id", "agency_stock_id"]
    exclude = ["marks", "upload_event", "clip_code"]
    fields = [
        "stock_id",
        "agency_stock_id",
        "species",
        "strain_raw",
        "agency",
        "hatchery",
        "jurisdiction",
        "site",
        "st_site",
        "grid_10",
        "dd_lat",
        "dd_lon",
        "latlong_flag",
        "geom",
        "date",
        "year",
        "month",
        "day",
        "stocking_method",
        "lifestage",
        "agemonth",
        "length",
        "weight",
        "year_class",
        "fin_clips",
        "fish_tags",
        "physchem_marks",
        "condition",
        "no_stocked",
        "yreq_stocked",
        "notes",
    ]
    date_hierarchy = "date"
    view_on_site = True

    autocomplete_fields = (
        "grid_10",
        "species",
        "agency",
        "stocking_method",
        "hatchery",
        "fin_clips",
        "physchem_marks",
        "fish_tags",
    )
