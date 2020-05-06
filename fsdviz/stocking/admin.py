from django.contrib import admin

from .models import LifeStage, Condition, StockingMethod, StockingEvent, Hatchery


admin.site.empty_value_display = "(None)"


@admin.register(LifeStage)
class LifeStageModelAdmin(admin.ModelAdmin):
    list_display = ("abbrev", "description")


@admin.register(Condition)
class ConditionModelAdmin(admin.ModelAdmin):
    list_display = ("condition", "description")


@admin.register(StockingMethod)
class StockingMethodModelAdmin(admin.ModelAdmin):
    list_display = ("stk_meth", "description")


@admin.register(Hatchery)
class HatcheryModelAdmin(admin.ModelAdmin):
    list_display = ("hatchery_name", "abbrev", "hatchery_type", "agency")
    list_filter = ("hatchery_name", "abbrev", "hatchery_type", "agency")
    search = ["hatchery_name"]


@admin.register(StockingEvent)
class StockingEventModelAdmin(admin.ModelAdmin):
    list_display = (
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
    list_select_related = ("species", "agency", "jurisdiction__lake", "stocking_method")
    list_filter = ("jurisdiction__lake", "lifestage", "species", "agency")
    search_fields = ["site"]
