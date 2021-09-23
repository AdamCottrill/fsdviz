"""Serializers for our stocking modesl.

Serializers convert our data base objects to json and back again (if
needed).

  """

from django.contrib.gis.geos import GEOSGeometry
from fsdviz.common.api.serializers import (
    AgencySerializer,
    Grid10Serializer,
    JurisdictionSerializer,
    ModelColorSerializer,
    LatLonFlagSerializer,
    SimpleSpeciesSerializer,
    SpeciesSerializer,
)
from rest_framework import serializers

from ..models import (
    Condition,
    Hatchery,
    LifeStage,
    StockingEvent,
    StockingMethod,
    YearlingEquivalent,
)


class LifeStageSerializer(ModelColorSerializer):
    class Meta:
        model = LifeStage
        fields = ("abbrev", "description", "color")


class HatcherySerializer(serializers.ModelSerializer):
    class Meta:
        model = Hatchery
        fields = ("hatchery_name", "abbrev", "description", "hatchery_type")


class YearlingEquivalentSerializer(serializers.ModelSerializer):

    lifestage = LifeStageSerializer()
    species = SimpleSpeciesSerializer()

    class Meta:
        model = YearlingEquivalent

        fields = ("species", "lifestage", "yreq_factor")


class ConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condition
        fields = ("condition", "description")


class StockingMethodSerializer(ModelColorSerializer):
    class Meta:
        model = StockingMethod
        fields = ("stk_meth", "description", "color")


class StockingEventFastSerializer(serializers.Serializer):
    """This is a paired down version of the stocking event serializer that
    includes just those values need to create our maps or the
    associated filter widgets.  The default serializer contains a lot
    of extra information that is expensive to calculate and not needed
    to put apoints on the map.  This serializer is intented to quickly
    provide a readonly list of json objects representing aggregations
    of stocking events.

    """

    stateprov = serializers.CharField()
    lake = serializers.CharField()
    jurisdiction_slug = serializers.CharField()
    man_unit = serializers.CharField()
    grid10 = serializers.CharField()
    stk_method = serializers.CharField()
    life_stage = serializers.CharField()
    agency_abbrev = serializers.CharField()
    species_name = serializers.CharField()
    strain = serializers.CharField()
    events = serializers.IntegerField()
    yreq = serializers.IntegerField()
    total_stocked = serializers.IntegerField()

    longitude = serializers.CharField()
    latitude = serializers.CharField()


class StockingEventSerializer(serializers.ModelSerializer):
    """This is going it be one of the work-horses of our applicaiton.
    Todo - add Strain.

    omits: 'length', 'weight', 'lotcode', 'validation', 'notes', 'grid_5',
    'mark_eff', 'tag_ret', 'date', 'dd_lat', 'dd_lon',

    """

    # could add other serializers here for lifestage, condition,
    # agency, species, etc.

    lifestage = LifeStageSerializer()
    condition = ConditionSerializer()
    stocking_method = StockingMethodSerializer()
    agency = AgencySerializer()

    jurisdiction = JurisdictionSerializer()
    grid_10 = Grid10Serializer()
    species = SpeciesSerializer()
    latlong_flag = LatLonFlagSerializer()

    # lake = LakeSerializer()

    @staticmethod
    def setup_eager_loading(queryset):
        """Perform necessary eager loading of data."""
        queryset = queryset.prefetch_related(
            "species",
            "agency",
            "condition",
            "stocking_method",
            "grid_10",
            "grid_10__lake",
            "jurisdiction",
            "jurisdiction__lake",
            "jurisdiction__stateprov",
            "latlong_flag",
            "lifestage",
        )
        return queryset

    class Meta:
        model = StockingEvent
        fields = (
            "stock_id",
            "day",
            "month",
            "year",
            "site",
            "st_site",
            "geom",
            "no_stocked",
            "year_class",
            "agemonth",
            "tag_no",
            # "clipa",
            "mark",
            "agency",
            "condition",
            "grid_10",
            "latlong_flag",
            "lifestage",
            "species",
            "stocking_method",
            "yreq_stocked",
            "jurisdiction",
        )

        read_only_fields = fields


class StockingEventXlsxSerializer(serializers.Serializer):
    """This serializer will be used by the data download functionality. It
    will be readonly, and match the fields included in the data submission
    template. A downloaded spreadsheet should look familiar to anyone who
    has submited data.

    #    GLFSD_Stock_ID",
    #"Your_Agency_Stock_ID",
    #"AGENCY",
    #"LAKE",
    #"STATE_PROV",
    #"STAT_DIST",
    #"LS_MGMT",
    #"GRID_10MIN",
    #"LOCATION_PRIMARY",
    #"LOCATION_SECONDARY",
    #"LATITUDE",
    #"LONGITUDE",
    #"YEAR",
    #"MONTH",
    #"DAY",
    #"STOCK_METHOD",
    #"SPECIES",
    #"STRAIN",
    #"YEAR-CLASS",
    #"LIFE_STAGE",
    #"AGE_MONTHS",
    #"CLIP",
    #"CLIP_EFFICIENCY",
    #"PHYS-CHEM_MARK",
    #"TAG_TYPE",
    #"CWT_Number",
    #"TAG_RETENTION",
    #"MEAN_LENGTH_MM",
    #"TOTAL_WEIGHT_KG",
    #"STOCKING_MORTALITY",
    #"LOT_CODE",
    #"HATCHERY",
    #"NUMBER_STOCKED",
    #"NOTES
    #

    """

    glfsd_stock_id = serializers.CharField()
    agency_stock_id = serializers.CharField()
    agency_code = serializers.CharField()
    _lake = serializers.CharField()
    state_prov = serializers.CharField()
    manUnit = serializers.CharField()
    # ls_mgmt= serializers.CharField(),
    grid_10min = serializers.CharField()
    location_primary = serializers.CharField()
    location_secondary = serializers.CharField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    year = serializers.IntegerField()
    month = serializers.IntegerField()
    day = serializers.IntegerField()
    stock_method = serializers.CharField()
    species_code = serializers.CharField()
    _strain = serializers.CharField()
    yearclass = serializers.IntegerField()
    life_stage = serializers.CharField()
    age_months = serializers.IntegerField()
    _clip = serializers.CharField()
    clip_efficiency = serializers.FloatField()
    phys_chem_mark = serializers.CharField()

    tag_type = serializers.CharField()
    cwt_number = serializers.CharField()
    tag_retention = serializers.FloatField()
    mean_length_mm = serializers.FloatField()
    total_weight_kg = serializers.FloatField()
    stocking_mortality = serializers.FloatField()
    lot_code = serializers.CharField()
    hatchery_abbrev = serializers.CharField()
    number_stocked = serializers.IntegerField()
    notes = serializers.CharField()


class CWTEventXlsxSerializer(serializers.Serializer):
    """This serializer will be used by the data download functionality. It
    will be readonly"""

    cwt_number = serializers.CharField()
    tag_type = serializers.CharField()
    seq_lower = serializers.CharField()
    seq_upper = serializers.CharField()
    manufacturer = serializers.CharField()
    tag_reused = serializers.CharField()
    multiple_lakes = serializers.CharField()
    multiple_species = serializers.CharField()
    multiple_strains = serializers.CharField()
    multiple_yearclasses = serializers.CharField()
    multiple_agencies = serializers.CharField()
    stock_id = serializers.CharField()
    agency_stock_id = serializers.CharField()
    agency_code = serializers.CharField()
    lake = serializers.CharField()
    state = serializers.CharField()
    jurisd = serializers.CharField()
    man_unit = serializers.CharField()
    grid10 = serializers.CharField()
    primary_location = serializers.CharField()
    secondary_location = serializers.CharField()
    latitude = serializers.CharField()
    longitude = serializers.CharField()
    year = serializers.CharField()
    month = serializers.CharField()
    day = serializers.CharField()
    spc = serializers.CharField()
    strain = serializers.CharField()
    year_class = serializers.CharField()
    mark = serializers.CharField()
    clipcode = serializers.CharField()
    stage = serializers.CharField()
    method = serializers.CharField()
    no_stocked = serializers.CharField()
