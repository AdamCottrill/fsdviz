from django.contrib.gis import admin

from ..models import CWT

admin.site.empty_value_display = "(None)"


@admin.register(CWT)
class CWTModelAdmin(admin.ModelAdmin):
    # consider adding filters for foreign keys - lake, agency and species.
    list_display = ("cwt_number", "tag_type", "manufacturer", "tag_reused")
    search_fields = ("cwt_number",)
    list_filter = ("tag_type", "manufacturer")
