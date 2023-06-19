from django.contrib.gis import admin
from .utils import fill_color_widget
from ..models import StrainRaw

admin.site.empty_value_display = "(None)"


@admin.register(StrainRaw)
class StrainRawModelAdmin(admin.ModelAdmin):
    list_display = (
        "raw_strain",
        "description",
        "species",
        "strain",
        "active",
        "fill_color",
        "modified_timestamp",
    )
    list_filter = ("species", "active")
    search_fields = ("description", "raw_strain")

    list_select_related = ("strain", "species", "strain__strain_species")

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "strain":
            object_id = request.resolver_match.kwargs.get("object_id")
            qs = Strain.objects.prefetch_related("species")

            if object_id:
                raw_strain = self.get_object(request, object_id)
                qs = qs.filter(strain_species=raw_strain.species)

            kwargs["queryset"] = qs.distinct()

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def fill_color(self, obj):
        return fill_color_widget(obj.color)
