from django import forms
from django.contrib.gis import admin
from django.db.models import Count
from .utils import fill_color_widget
from ..models import StrainAlias, Strain

admin.site.empty_value_display = "(None)"




@admin.register(StrainAlias)
class StrainAliasModelAdmin(admin.ModelAdmin):
    list_display = (
        "strain_alias",
        "description",
        "species",
        "strain",
        "active",
        "fill_color",
        "modified_timestamp",
        "event_count"
    )
    list_filter = ("species", "active")
    search_fields = ("description", "strain_alias")

    list_select_related = ("strain", "species", "strain__strain_species")

    exclude = ("species",)

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def event_count(self, obj):
        return obj._event_count

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "strain":
            object_id = request.resolver_match.kwargs.get("object_id")
            qs = Strain.objects.prefetch_related("species").select_related(
                "strain_species"
            )

            if object_id:
                strain_alias = self.get_object(request, object_id)
                qs = qs.filter(strain_species=strain_alias.species)
            kwargs["queryset"] = qs.order_by("strain_label").distinct()

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def fill_color(self, obj):
        return fill_color_widget(obj.color)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            _event_count=Count("stocking_events", distinct=True),
          )
        return queryset
