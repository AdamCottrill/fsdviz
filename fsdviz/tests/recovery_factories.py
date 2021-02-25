from datetime import datetime
import factory

from django.contrib.gis.geos import GEOSGeometry

from fsdviz.recovery.models import RecoveryEvent, Recovery

from .common_factories import (
    LakeFactory,
    AgencyFactory,
    SpeciesFactory,
    StateProvinceFactory,
    Grid10Factory,
    LatLonFlagFactory,
)


class RecoveryEventFactory(factory.django.DjangoModelFactory):
    """
    A factory for RecoveryEvent objects.
    """

    class Meta:
        model = RecoveryEvent

    # foreign keys:

    agency = factory.SubFactory(AgencyFactory)
    lake = factory.SubFactory(LakeFactory)
    grid_10 = factory.SubFactory(Grid10Factory)
    stateprov = factory.SubFactory(StateProvinceFactory)

    lift_identifier = factory.Sequence(lambda n: "Net-%03d" % n)

    location = "Over there."
    dd_lat = 45.5
    dd_lon = -81.25
    geom = GEOSGeometry("POINT(-81.25 45.5)", srid=4326)
    latlong_flag = factory.SubFactory(LatLonFlagFactory)

    date = datetime(2016, 4, 20)
    day = 20
    month = 4
    year = 2016


class RecoveryFactory(factory.django.DjangoModelFactory):
    """
    A factory for CWT Recovery objects.
    """

    class Meta:
        model = Recovery

    recovery_event = factory.SubFactory(RecoveryEventFactory)
    species = factory.SubFactory(SpeciesFactory)

    cwt_number = "123456"
    fish_identifier_key = factory.Sequence(lambda n: "Fish-%03d" % n)
