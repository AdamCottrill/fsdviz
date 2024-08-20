"""Serializers for our common models.

Serializers convert our data base objects to json and back again (if
needed).

  """

from fsdviz.common.models import (
    CWT,
    Agency,
    CompositeFinClip,
    FishTag,
    Grid10,
    Jurisdiction,
    Lake,
    LatLonFlag,
    ManagementUnit,
    Mark,
    PhysChemMark,
    Species,
    StateProvince,
    Strain,
    StrainAlias,
)
from rest_framework import serializers


class ModelColorSerializer(serializers.ModelSerializer):
    """An abstract base class for serializers for objects that have an
    optional colour attribute.  Colours only need be returned on
    lookup-api endpoints - not every endpoint. Colour is returned if
    color=True is passed to the serializer."""

    def __init__(self, *args, **kwargs):
        color = kwargs.pop("color", False)
        super(ModelColorSerializer, self).__init__(*args, **kwargs)
        if color is False:
            self.fields.pop("color")


class AgencySerializer(ModelColorSerializer):
    class Meta:
        model = Agency
        fields = ("abbrev", "agency_name", "color")


class LakeSerializer(ModelColorSerializer):
    class Meta:
        model = Lake
        fields = ("abbrev", "lake_name", "color")
        lookup_field = "abbrev"


class StateProvinceSerializer(ModelColorSerializer):
    class Meta:
        model = StateProvince
        fields = ("id", "abbrev", "name", "country", "description", "color")


class JurisdictionSerializer(ModelColorSerializer):

    lake = LakeSerializer()
    stateprov = StateProvinceSerializer()

    # lake = serializers.ReadOnlyField(source='lake.lake_name')
    # stateprov = serializers.ReadOnlyField(source='stateprov.name')

    class Meta:
        model = Jurisdiction
        fields = ("id", "slug", "name", "lake", "stateprov", "description", "color")

    @staticmethod
    def setup_eager_loading(queryset):
        """Perform necessary eager loading of data."""
        queryset = queryset.select_related("lake", "stateprov")
        return queryset


class ManagementUnitSerializer(ModelColorSerializer):

    lake = LakeSerializer()

    class Meta:
        model = ManagementUnit
        fields = (
            "id",
            "label",
            "description",
            "lake",
            "mu_type",
            "slug",
            "primary",
            "color",
        )

    @staticmethod
    def setup_eager_loading(queryset):
        """Perform necessary eager loading of data."""
        queryset = queryset.select_related("lake")
        return queryset


class SimpleSpeciesSerializer(serializers.ModelSerializer):
    """A simple serializer for species objects that contains just the
    abbreviation and common name. This serializer is intended to be used
    as a nested-serializer.
    """

    class Meta:
        model = Species
        fields = (
            "abbrev",
            "common_name",
        )
        lookup_field = "abbrev"


class SpeciesSerializer(ModelColorSerializer):
    class Meta:
        model = Species
        fields = (
            "abbrev",
            "common_name",
            "scientific_name",
            "species_code",
            "speciescommon",
            "color",
        )
        lookup_field = "abbrev"


class StrainSpeciesSerializer(ModelColorSerializer):
    """A serialicer for strain objects that also includes attributes of
    the related species.  There can only be one related species
    object for each strain.
    """

    strain_species = SpeciesSerializer(many=False)

    class Meta:
        model = Strain
        fields = (
            "id",
            "strain_code",
            "strain_label",
            "strain_species",
            "slug",
            "color",
        )

    @staticmethod
    def setup_eager_loading(queryset):
        """Perform necessary eager loading of data."""
        queryset = queryset.select_related("strain_species")
        return queryset


class StrainSerializer(ModelColorSerializer):
    """A simplified serializer for strain objects - used in the strainRaw
    Serializers.  This version does *not* include the species serializer as
    it is already included in the StrainAliasSerializer.
    """

    class Meta:
        model = Strain
        fields = ("id", "strain_code", "strain_label", "slug", "color")


class StrainAliasSerializer(ModelColorSerializer):
    """A serializer for Strain Raw objects. Includes nested serializers
    for both species and strain objects.  Uses the simplified strain
    serializer that does not include species.  StrainAlias is
    effectively an association table between species and strain -
    there can only be one species and one strain fro each record.
    """

    species = SpeciesSerializer(many=False)
    strain = StrainSerializer(many=False)

    class Meta:
        model = StrainAlias
        fields = ("id", "raw_strain", "description", "species", "strain", "color")

    @staticmethod
    def setup_eager_loading(queryset):
        """Perform necessary eager loading of data."""
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
        """Perform necessary eager loading of data."""
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


class CompositeFinClipSerializer(ModelColorSerializer):
    class Meta:
        model = CompositeFinClip
        fields = ("clip_code", "description", "color")


class FishTagSerializer(ModelColorSerializer):
    class Meta:
        model = FishTag
        fields = ("tag_code", "tag_type", "tag_colour", "description", "color")


class PhysChemMarkSerializer(ModelColorSerializer):
    class Meta:
        model = PhysChemMark
        fields = ("mark_code", "mark_type", "description", "color")
