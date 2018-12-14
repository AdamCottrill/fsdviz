from django.contrib import admin

# Register your models here.



from .models import (Agency, Lake, StateProvince, ManagementUnit, Species,
                     Strain, StrainRaw)

admin.site.empty_value_display = '(None)'

@admin.register(Agency)
class AgencyModelAdmin(admin.ModelAdmin):
    list_display = ('abbrev', 'agency_name')


@admin.register(Lake)
class LakeModelAdmin(admin.ModelAdmin):
    list_display = ('abbrev', 'lake_name')


@admin.register(StateProvince)
class StateProvinceModelAdmin(admin.ModelAdmin):
    list_display = ('abbrev', 'name', 'country')


@admin.register(ManagementUnit)
class ManagementUnitModelAdmin(admin.ModelAdmin):
    list_display = ('label', 'lake', 'mu_type', 'description')
    list_filter =  ('lake', 'mu_type')


@admin.register(Species)
class SpeciesModelAdmin(admin.ModelAdmin):
    list_display = ('abbrev', 'common_name', 'scientific_name')


@admin.register(Strain)
class StrainModelAdmin(admin.ModelAdmin):
    list_display = ('strain_code', 'strain_species', 'strain_label')
    list_select_related = ('strain_species',)
    list_filter = ('strain_species', 'strain_code')


@admin.register(StrainRaw)
class StrainRawModelAdmin(admin.ModelAdmin):
    list_display = ('raw_strain', 'species', 'strain')
    list_select_related = ('strain', 'species',)
    list_filter = ('species',)
    search_fields = ['description', 'raw_strain']
