"""Serializers for our stocking modesl.

Serializers convert our data base objects to json and back again (if
needed).

  """

from rest_framework import serializers
from fsdviz.stocking.models import (LifeStage, Condition, StockingMethod,
                                    StockingEvent)

from fsdviz.common.api.serializers import (
    AgencySerializer, JurisdictionSerializer, LakeSerializer,
    SpeciesSerializer, Grid10Serializer, LatLonFlagSerializer)


class LifeStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LifeStage
        fields = ('abbrev', 'description')


class ConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condition
        fields = ('condition', 'description')


class StockingMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockingMethod
        fields = ('stk_meth', 'description')


class StockingEventMapSerializer(serializers.ModelSerializer):
    """This is a paired down version of the stocking event serializer that
    includes just those values need to create our maps.  The default
    serializer contains a lot of extra incormation that is expensive to
    calculate and not needed to put apoints on the make.

    """

    species = serializers.CharField(source='species.common_name',
                                    read_only=True)
    lifestage = serializers.CharField(source='lifestage.abbrev',
                                      read_only=True)
    events = serializers.IntegerField()
    total_yreq_stocked = serializers.IntegerField()


    @staticmethod
    def setup_eager_loading(queryset):
        """ Perform necessary eager loading of data. """
        queryset = queryset.prefetch_related('species',
                                             'lifestage')
        return queryset

    class Meta:
        model = StockingEvent
        fields = ('geom', 'yreq_stocked', 'species', 'lifestage', 'events',
                  'total_yreq_stocked')




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
        """ Perform necessary eager loading of data. """
        queryset = queryset.prefetch_related('species', 'agency', 'condition',
                                             'stocking_method',
                                             'grid_10',
                                             'grid_10__lake',
                                             'jurisdiction',
                                             'jurisdiction__lake',
                                             'jurisdiction__stateprov',
                                             'latlong_flag',
                                             'lifestage')
        return queryset

    class Meta:
        model = StockingEvent
        fields = ('stock_id', 'day', 'month', 'year', 'site', 'st_site',
                  'geom', 'no_stocked', 'year_class', 'agemonth', 'tag_no',
                  'clipa', 'mark', 'agency', 'condition', 'grid_10',
                  'latlong_flag', 'lifestage', 'species', 'stocking_method',
                  'yreq_stocked', 'jurisdiction')
