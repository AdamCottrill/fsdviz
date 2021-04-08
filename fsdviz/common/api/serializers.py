"""Serializers for our common models.

Serializers convert our data base objects to json and back again (if
needed).

  """

from rest_framework import serializers
from fsdviz.common.models import (
    Agency,
    Species,
    Lake,
    StateProvince,
    Jurisdiction,
    ManagementUnit,
    Strain,
    StrainRaw,
    CWT,
    Grid10,
    LatLonFlag,
    Mark,
)


class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = ("abbrev", "agency_name")


class LakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lake
        fields = ("abbrev", "lake_name")
        lookup_field = "abbrev"


class StateProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StateProvince
        fields = ("id", "abbrev", "name", "country", "description")


class JurisdictionSerializer(serializers.ModelSerializer):

    lake = LakeSerializer()
    stateprov = StateProvinceSerializer()

    # lake = serializers.ReadOnlyField(source='lake.lake_name')
    # stateprov = serializers.ReadOnlyField(source='stateprov.name')

    class Meta:
        model = Jurisdiction
        fields = ("id", "slug", "name", "lake", "stateprov", "description")

    @staticmethod
    def setup_eager_loading(queryset):
        """ Perform necessary eager loading of data. """
        queryset = queryset.select_related("lake", "stateprov")
        return queryset


class ManagementUnitSerializer(serializers.ModelSerializer):

    lake = LakeSerializer()

    class Meta:
        model = ManagementUnit
        fields = ("id", "label", "lake", "mu_type", "slug", "primary")

    @staticmethod
    def setup_eager_loading(queryset):
        """ Perform necessary eager loading of data. """
        queryset = queryset.select_related("lake")
        return queryset


class SpeciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Species
        fields = (
            "abbrev",
            "common_name",
            "scientific_name",
            "species_code",
            "speciescommon",
        )
        lookup_field = "abbrev"


class StrainSpeciesSerializer(serializers.ModelSerializer):
    """A serialicer for strain objects that also includes attributes of
    the related species.  There can only be one related species
    object for each strain.
    """

    strain_species = SpeciesSerializer(many=False)

    class Meta:
        model = Strain
        fields = ("id", "strain_code", "strain_label", "strain_species", "slug")

    @staticmethod
    def setup_eager_loading(queryset):
        """ Perform necessary eager loading of data. """
        queryset = queryset.select_related("strain_species")
        return queryset


class StrainSerializer(serializers.ModelSerializer):
    """A simplified serializer for strain objects - used in the strainRaw
    Serializers.  This version does *not* include the species serializer as
    it is already included in the StrainRawSerializer.
    """

    class Meta:
        model = Strain
        fields = ("id", "strain_code", "strain_label", "slug")


class StrainRawSerializer(serializers.ModelSerializer):
    """A serializer for Strain Raw objects. Includes nested serializers
    for both species and strain objects.  Uses the simplified strain
    serializer that does not include species.  StrainRaw is
    effectively an association table between species and strain -
    there can only be one species and one strain fro each record.
    """

    species = SpeciesSerializer(many=False)
    strain = StrainSerializer(many=False)

    class Meta:
        model = StrainRaw
        fields = ("id", "raw_strain", "description", "species", "strain")

    @staticmethod
    def setup_eager_loading(queryset):
        """ Perform necessary eager loading of data. """
        queryset = queryset.select_related("species", "strain")
        return queryset


class CWTSerializer(serializers.ModelSerializer):
    class Meta:
        model = CWT
        fields = (
            "cwt_number",
            "tag_type",
            "manufacturer",
            "slug",
            # "tag_reused",
            # "multiple_species",
            # "multiple_strains",
            # "multiple_yearclasses",
            # "multiple_makers",
            # "multiple_agencies",
            # "multiple_lakes",
            # "multiple_grid10s",
        )


class Grid10Serializer(serializers.ModelSerializer):

    lake = LakeSerializer()

    #    lake = serializers.HyperlinkedRelatedField(
    #        view_name='common_api:lake-detail', lookup_field='abbrev',
    #        read_only=True)

    class Meta:
        model = Grid10
        fields = ("id", "grid", "lake", "centroid", "slug")

    @staticmethod
    def setup_eager_loading(queryset):
        """ Perform necessary eager loading of data. """
        queryset = queryset.select_related("lake")
        return queryset


class LatLonFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = LatLonFlag
        fields = ("value", "description")


class MarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mark
        fields = ("clip_code", "mark_code", "mark_type", "description")
