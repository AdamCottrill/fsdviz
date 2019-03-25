"""Serializers for our common models.

Serializers convert our data base objects to json and back again (if
needed).

  """

from rest_framework import serializers
from fsdviz.common.models import (Agency, Species, Lake, StateProvince,
                                  Jurisdiction, ManagementUnit, Strain, CWT)


class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = ('abbrev', 'agency_name')



class LakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lake
        fields = ('abbrev', 'lake_name')


class StateProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StateProvince
        fields = ('abbrev', 'name', 'country')


class JurisdictionSerializer(serializers.ModelSerializer):

    lake = serializers.StringRelatedField()
    stateprov = serializers.StringRelatedField()

    class Meta:
        model = Jurisdiction
        fields = ('name', 'lake', 'stateprov')


class ManagementUnitSerializer(serializers.ModelSerializer):

    lake = serializers.StringRelatedField()

    class Meta:
        model = ManagementUnit
        fields = ('label', 'lake', 'mu_type', 'centroid')


class SpeciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Species
        fields = ('abbrev', 'common_name', 'scientific_name', 'species_code',
                  'speciescommon')



#class StrainSerializer(serializers.ModelSerializer):
#    class Meta:
#        model = Strain
#        fields = ('abbrev', 'name', 'country')
#


class CWTSerializer(serializers.ModelSerializer):
    class Meta:
        model = CWT
        fields = ('cwt_number', 'tag_type', 'manufacturer', 'tag_reused',
                  'multiple_species', 'multiple_strains',
                  'multiple_yearclasses', 'multiple_makers',
                  'multiple_agencies', 'multiple_lakes', 'multiple_grid10s')
