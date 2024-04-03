"""
Factories for the models in the stocking application - lifestage, condition,
stocking event, etc.

"""

from datetime import datetime
import factory

from django.contrib.gis.geos import GEOSGeometry

# import common.models as common
from ...stocking.models import (
    LifeStage,
    Condition,
    Hatchery,
    StockingMethod,
    StockingEvent,
    DataUploadEvent,
    LifeStage,
    YearlingEquivalent,
)

from .common_factories import (
    LakeFactory,
    JurisdictionFactory,
    AgencyFactory,
    SpeciesFactory,
    ManagementUnitFactory,
    StrainRawFactory,
    StateProvinceFactory,
    Grid10Factory,
    LatLonFlagFactory,
)

from fsdviz.myusers.tests.factories import UserFactory


class LifeStageFactory(factory.django.DjangoModelFactory):
    """
    A factory for Lifestate objects.
    """

    class Meta:
        model = LifeStage
        django_get_or_create = ("abbrev",)

    abbrev = "y"
    description = "Yearling"
    color = "#bcf60c"


class YearlingEquivalentFactory(factory.django.DjangoModelFactory):
    """
    A factory for YearlingEquivalent objects.
    """

    class Meta:
        model = YearlingEquivalent
        django_get_or_create = ("species", "lifestage")

    species = factory.SubFactory(SpeciesFactory)
    lifestage = factory.SubFactory(LifeStageFactory)
    yreq_factor = 1.0


class ConditionFactory(factory.django.DjangoModelFactory):
    """
    A factory for Condition objects.
    """

    class Meta:
        model = Condition
        django_get_or_create = ("condition",)

    condition = 1
    description = '<1% mortality observed, "excellent"'


class HatcheryFactory(factory.django.DjangoModelFactory):
    """
    A factory for Hatchery objects.
    """

    class Meta:
        model = Hatchery
        django_get_or_create = ("abbrev",)

    agency = factory.SubFactory(AgencyFactory)
    hatchery_name = "Chatsworth Fish Culture Station"
    hatchery_type = "provincial"
    abbrev = "CWC"


class StockingMethodFactory(factory.django.DjangoModelFactory):
    """
    A factory for StockingMethod objects.
    """

    class Meta:
        model = StockingMethod
        django_get_or_create = ("stk_meth",)

    stk_meth = "b"
    description = "boat, offshore stocking"


class StockingEventFactory(factory.django.DjangoModelFactory):
    """
    A factory for StockingEvent objects.
    """

    class Meta:
        model = StockingEvent

    # foreign keys:
    species = factory.SubFactory(SpeciesFactory)
    strain_raw = factory.SubFactory(StrainRawFactory)
    agency = factory.SubFactory(AgencyFactory)
    hatchery = factory.SubFactory(HatcheryFactory)
    jurisdiction = factory.SubFactory(JurisdictionFactory)
    # lake = factory.SubFactory(LakeFactory)
    management_unit = factory.SubFactory(ManagementUnitFactory)
    grid_10 = factory.SubFactory(Grid10Factory)
    # stateprov = factory.SubFactory(StateProvinceFactory)
    stocking_method = factory.SubFactory(StockingMethodFactory)
    lifestage = factory.SubFactory(LifeStageFactory)
    condition = factory.SubFactory(ConditionFactory)

    latlong_flag = factory.SubFactory(LatLonFlagFactory)

    tag_no = None

    # event attributes:
    # stock_id = factory.Sequence(lambda n: "2019-%04d" % n)

    # event attributes:
    agency_stock_id = factory.Sequence(lambda n: "USFWS-%04d" % n)

    date = datetime(2016, 4, 20)
    day = 20
    month = 4
    year = 2016
    site = "The Reef"

    dd_lat = 45.5
    dd_lon = -81.25

    geom = GEOSGeometry("POINT(-81.25 45.5)", srid=4326)

    no_stocked = 15000
    yreq_stocked = 15000
    year_class = 2015
    agemonth = 16

    length = 125
    weight = 100

    # clipa = "14"
    mark = "RPLV"


class DataUploadEventFactory(factory.django.DjangoModelFactory):
    """
    A factory for DataUploadEvent objects.
    """

    class Meta:
        model = DataUploadEvent

    uploaded_by = factory.SubFactory(UserFactory)
    lake = factory.SubFactory(LakeFactory)
    agency = factory.SubFactory(AgencyFactory)
