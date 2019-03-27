"""Serializers for our common models.

Serializers convert our data base objects to json and back again (if
needed).

  """

from rest_framework import serializers
from fsdviz.common.models import (Agency, Species, Lake, StateProvince,
                                  Jurisdiction, ManagementUnit, Strain,
                                  StrainRaw, CWT, Grid10, LatLonFlag, Mark)


class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = ('abbrev', 'agency_name')


class LakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lake
        fields = ('abbrev', 'lake_name')
        lookup_field = 'abbrev'


class StateProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StateProvince
        fields = ('abbrev', 'name', 'country')


class JurisdictionSerializer(serializers.ModelSerializer):

    lake = LakeSerializer()
    stateprov = StateProvinceSerializer()

    #lake = serializers.ReadOnlyField(source='lake.lake_name')
    #stateprov = serializers.ReadOnlyField(source='stateprov.name')

    class Meta:
        model = Jurisdiction
        fields = ('name', 'lake', 'stateprov')


class ManagementUnitSerializer(serializers.ModelSerializer):

    lake = LakeSerializer()

    class Meta:
        model = ManagementUnit
        fields = ('label', 'lake', 'mu_type', 'centroid')


class SpeciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Species
        fields = ('abbrev', 'common_name', 'scientific_name', 'species_code',
                  'speciescommon')
        lookup_field = 'abbrev'


class StrainSerializer(serializers.ModelSerializer):

    strain_species = SpeciesSerializer()

    class Meta:
        model = Strain
        fields = ('strain_code', 'strain_label', 'strain_species')


class StrainRawSerializer(serializers.HyperlinkedModelSerializer):

    species = serializers.HyperlinkedRelatedField(
        view_name='common_api:species-detail',
        lookup_field='abbrev',
        read_only=True)

    strain = serializers.HyperlinkedRelatedField(
        view_name='common_api:strain-detail', read_only=True)

    class Meta:
        model = StrainRaw
        fields = ('raw_strain', 'description', 'species', 'strain')


class CWTSerializer(serializers.ModelSerializer):
    class Meta:
        model = CWT
        fields = ('cwt_number', 'tag_type', 'manufacturer', 'tag_reused',
                  'multiple_species', 'multiple_strains',
                  'multiple_yearclasses', 'multiple_makers',
                  'multiple_agencies', 'multiple_lakes', 'multiple_grid10s')


class Grid10Serializer(serializers.ModelSerializer):

    lake = LakeSerializer()

    #    lake = serializers.HyperlinkedRelatedField(
    #        view_name='common_api:lake-detail', lookup_field='abbrev',
    #        read_only=True)

    class Meta:
        model = Grid10
        fields = ('grid', 'lake', 'centroid')


class LatLonFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = LatLonFlag
        fields = ('value', 'description')


class MarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mark
        fields = ('clip_code', 'mark_code', 'mark_type', 'description')
