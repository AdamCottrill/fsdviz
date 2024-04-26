from django.contrib import admin

from ..models import StockingMortality

admin.site.empty_value_display = "(None)"


@admin.register(StockingMortality)
class StockingMortalityModelAdmin(admin.ModelAdmin):
    list_display = ("value", "description")
