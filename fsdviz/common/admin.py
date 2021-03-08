from django.contrib.gis import admin

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
    list_display = ("agency_name", "abbrev")
    search_fields = ("agency_name",)


@admin.register(Lake)
class LakeModelAdmin(admin.OSMGeoAdmin):
    list_display = ("lake_name", "abbrev")


@admin.register(StateProvince)
class StateProvinceModelAdmin(admin.OSMGeoAdmin):
    list_display = ("name", "abbrev", "country")


@admin.register(Jurisdiction)
class JurisdictionModelAdmin(admin.OSMGeoAdmin):
    list_display = ("name", "lake", "stateprov", "description")
    list_filter = ("lake", "stateprov")


@admin.register(ManagementUnit)
class ManagementUnitModelAdmin(admin.OSMGeoAdmin):
    list_display = ("label", "lake", "mu_type", "description")
    list_filter = ("lake", "mu_type")
    search_fields = ("label",)


@admin.register(Grid10)
class Grid10Admin(admin.OSMGeoAdmin):
    list_display = ("grid", "lake", "slug")
    list_filter = ("lake",)
    search_fields = ("grid",)


@admin.register(Species)
class SpeciesModelAdmin(admin.ModelAdmin):
    list_display = ("abbrev", "common_name", "scientific_name")
    search_fields = ["abbrev", "common_name"]


@admin.register(Strain)
class StrainModelAdmin(admin.ModelAdmin):
    list_display = ("strain_code", "strain_species", "strain_label")
    # list_select_related = ('strain_species',)
    list_filter = ("strain_species", "strain_code")
    search_fields = ("strain_label",)


@admin.register(StrainRaw)
class StrainRawModelAdmin(admin.ModelAdmin):
    list_display = ("raw_strain", "species", "strain")
    # list_select_related = ('strain', 'species',)
    list_filter = ("species",)
    search_fields = ("description", "raw_strain")


@admin.register(Mark)
class MarkModelAdmin(admin.ModelAdmin):
    list_display = ("mark_code", "mark_type", "clip_code", "description")
    list_filter = ("mark_type",)
    search_fields = ("description",)


@admin.register(PhysChemMark)
class PhysChemMarkModelAdmin(admin.ModelAdmin):
    list_display = ("mark_code", "mark_type", "description")
    list_filter = ("mark_type",)
    search_fields = (
        "mark_code",
        "description",
    )


@admin.register(FishTag)
class FishTagModelAdmin(admin.ModelAdmin):
    list_display = ("tag_code", "tag_type", "tag_colour", "description")
    list_filter = ("tag_code", "tag_type", "tag_colour")
    search_fields = (
        "tag_code",
        "description",
    )


@admin.register(FinClip)
class FinClipModelAdmin(admin.ModelAdmin):
    list_display = ("abbrev", "description")
    list_filter = ("abbrev",)
    search_fields = ("abbrev", "description")


@admin.register(CompositeFinClip)
class CompositeFinClipModelAdmin(admin.ModelAdmin):
    list_display = ("clip_code", "description")
    list_filter = ("clip_code",)
    search_fields = ("clip_code", "description")


@admin.register(LatLonFlag)
class LatLonFlagModelAdmin(admin.ModelAdmin):
    list_display = ("value", "description")


@admin.register(CWT)
class CWTModelAdmin(admin.ModelAdmin):
    # consider adding filters for foreign keys - lake, agency and species.
    list_display = ("cwt_number", "tag_type", "manufacturer", "tag_reused")
    search_fields = ("cwt_number",)
    list_filter = ("tag_type", "manufacturer")
