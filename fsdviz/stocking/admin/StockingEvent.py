from django.contrib import admin

from ..models import StockingEvent

admin.site.empty_value_display = "(None)"


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
