from django.contrib import admin

from .models import LifeStage, Condition, StockingMethod, StockingEvent


admin.site.empty_value_display = '(None)'

@admin.register(LifeStage)
class LifeStageModelAdmin(admin.ModelAdmin):
    list_display = ('abbrev', 'description')


@admin.register(Condition)
class ConditionModelAdmin(admin.ModelAdmin):
    list_display = ('condition', 'description')


@admin.register(StockingMethod)
class StockingMethodModelAdmin(admin.ModelAdmin):
    list_display = ('stk_meth', 'description')


@admin.register(StockingEvent)
class StockingEventModelAdmin(admin.ModelAdmin):
    list_display = ('species', 'agency', 'lake', 'year_class',
                    'agemonth', 'lifestage',
                    'date', 'site', 'no_stocked')
    list_select_related = ('species','agency', 'lake', 'stocking_method')
    list_filter = ('lake', 'lifestage', 'species','agency')
    search_fields = ['site']
