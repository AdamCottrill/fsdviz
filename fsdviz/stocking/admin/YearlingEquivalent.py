from django.contrib import admin

from ..models import YearlingEquivalent

admin.site.empty_value_display = "(None)"


@admin.register(YearlingEquivalent)
class YearlingEquivalentModelAdmin(admin.ModelAdmin):
    list_display = (
        "species",
        "lifestage",
        "yreq_factor",
        "comment",
        "modified_timestamp",
    )
    list_filter = ("species", "lifestage")
    search_fields = ("species", "lifestage")

    ordering = ("species__common_name", "yreq_factor")

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ("species", "lifestage")
        else:
            return []
