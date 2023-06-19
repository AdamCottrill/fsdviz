from django.contrib import admin

from ..models import Condition

admin.site.empty_value_display = "(None)"


@admin.register(Condition)
class ConditionModelAdmin(admin.ModelAdmin):
    list_display = ("condition", "description")
