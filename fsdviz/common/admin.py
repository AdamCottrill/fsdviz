from django.contrib.gis import admin

from .utils import fill_color_widget
from .models import (
    Agency,
    Lake,
    StateProvince,
    ManagementUnit,
    Species,
    Grid10,
    Strain,
    StrainRaw,
    Mark,
    LatLonFlag,
    CWT,
    Jurisdiction,
    PhysChemMark,
    CompositeFinClip,
    FinClip,
    FishTag,
)

admin.site.empty_value_display = "(None)"


@admin.register(Agency)
class AgencyModelAdmin(admin.ModelAdmin):
    list_display = ("agency_name", "abbrev", "fill_color")
    search_fields = ("agency_name", "abbrev")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(Lake)
class LakeModelAdmin(admin.GeoModelAdmin):
    list_display = ("lake_name", "abbrev", "fill_color")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(StateProvince)
class StateProvinceModelAdmin(admin.GeoModelAdmin):
    list_display = ("name", "abbrev", "country", "fill_color")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(Jurisdiction)
class JurisdictionModelAdmin(admin.GeoModelAdmin):
    list_display = ("name", "lake", "stateprov", "description", "fill_color")
    list_filter = ("lake", "stateprov")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(ManagementUnit)
class ManagementUnitModelAdmin(admin.GeoModelAdmin):
    list_display = ("label", "lake", "mu_type", "description", "fill_color")
    list_filter = ("lake", "mu_type")
    search_fields = ("label",)

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(Grid10)
class Grid10Admin(admin.GeoModelAdmin):
    list_display = ("grid", "lake", "slug")
    list_filter = ("lake",)
    search_fields = ("grid",)


@admin.register(Species)
class SpeciesModelAdmin(admin.ModelAdmin):
    list_display = ("abbrev", "common_name", "scientific_name", "active", "fill_color")
    search_fields = ["abbrev", "common_name"]
    list_filter = [
        "active",
    ]

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(Strain)
class StrainModelAdmin(admin.ModelAdmin):
    list_display = (
        "strain_code",
        "strain_species",
        "strain_label",
        "active",
        "fill_color",
    )
    # list_select_related = ('strain_species',)
    list_filter = ("active", "strain_species", "strain_code")
    search_fields = ("strain_label", "strain_code")

    def get_queryset(self, request):
        qs = super(StrainModelAdmin, self).get_queryset(request)
        return qs.distinct()

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(StrainRaw)
class StrainRawModelAdmin(admin.ModelAdmin):
    list_display = (
        "raw_strain",
        "description",
        "species",
        "strain",
        "active",
        "fill_color",
    )
    list_filter = ("species", "active")
    search_fields = ("description", "raw_strain")

    list_select_related = ("strain", "species", "strain__strain_species")

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


@admin.register(Mark)
class MarkModelAdmin(admin.ModelAdmin):
    list_display = ("mark_code", "mark_type", "clip_code", "description")
    list_filter = ("mark_type",)
    search_fields = ("description", "mark_code")


@admin.register(PhysChemMark)
class PhysChemMarkModelAdmin(admin.ModelAdmin):
    list_display = ("mark_code", "mark_type", "description", "fill_color")
    list_filter = ("mark_type",)
    search_fields = (
        "mark_code",
        "description",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(FishTag)
class FishTagModelAdmin(admin.ModelAdmin):
    list_display = ("tag_code", "tag_type", "tag_colour", "description", "fill_color")
    list_filter = ("tag_code", "tag_type", "tag_colour")
    search_fields = (
        "tag_code",
        "description",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(FinClip)
class FinClipModelAdmin(admin.ModelAdmin):
    list_display = ("abbrev", "description", "fill_color")
    list_filter = ("abbrev",)
    search_fields = ("abbrev", "description")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(CompositeFinClip)
class CompositeFinClipModelAdmin(admin.ModelAdmin):
    list_display = ("clip_code", "description", "fill_color")
    list_filter = ("clip_code",)
    search_fields = ("clip_code", "description")

    def fill_color(self, obj):
        return fill_color_widget(obj.color)


@admin.register(LatLonFlag)
class LatLonFlagModelAdmin(admin.ModelAdmin):
    list_display = ("value", "description")


@admin.register(CWT)
class CWTModelAdmin(admin.ModelAdmin):
    # consider adding filters for foreign keys - lake, agency and species.
    list_display = ("cwt_number", "tag_type", "manufacturer", "tag_reused")
    search_fields = ("cwt_number",)
    list_filter = ("tag_type", "manufacturer")
