"""Serializers for our stocking modesl.

Serializers convert our data base objects to json and back again (if
needed).

  """

from rest_framework import serializers
from fsdviz.stocking.models import (LifeStage, Condition, StockingMethod,
                                  StockingEvent)


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


class StockingEventSerializer(serializers.ModelSerializer):
    """This is going it be one of the work-horses of our applicaiton.
    Todo - add Strain.

    omits: 'length', 'weight', 'lotcode', 'validation', 'notes', 'grid_5',
    'mark_eff', 'tag_ret', 'date', 'dd_lat', 'dd_lon',

    """

    #could add other serializers here for lifestage, condition,
    #agency, species, etc.


    class Meta:
        model = StockingEvent
        fields = ('stock_id', 'day', 'month', 'year', 'site', 'st_site',
                  'geom', 'no_stocked', 'year_class', 'agemonth', 'tag_no',
                  'clipa', 'mark', 'agency', 'condition', 'grid_10',
                  'latlong_flag', 'lifestage', 'species', 'stocking_method',
                  'yreq_stocked', 'jurisdiction')
