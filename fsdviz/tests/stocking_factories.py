"""
Factories for the models in the common application - agency, lake,
species, ect.

"""

import factory


#import common.models as common
from ..stocking.models import LifeStage, Condition, StockingMethod


class LifeStageFactory(factory.DjangoModelFactory):
    """
    A factory for LatLonFlag objects.
    """

    class Meta:
        model = LifeStage

    abbrev = 'y'
    description = 'Yearling'


class ConditionFactory(factory.DjangoModelFactory):
    """
    A factory for Condition objects.
    """

    class Meta:
        model = Condition

    condition = 1
    description = '<1% mortality observed, "excellent"'


class StockingMethodFactory(factory.DjangoModelFactory):
    """
    A factory for StockingMethod objects.
    """

    class Meta:
        model = StockingMethod

    stk_meth = 'b'
    description = 'boat, offshore stocking'
