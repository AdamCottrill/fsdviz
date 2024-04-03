"""
Tests for the models in the recovery application - recovery
events, recovery methods, ect.

"""

import pytest

from django.contrib.gis.geos import GEOSGeometry

from ..factories.common_factories import AgencyFactory, LakeFactory

from ..factories.recovery_factories import RecoveryFactory, RecoveryEventFactory


@pytest.mark.django_db
def test_recovery_event_str():
    """

    Verify that the string representation of a recovery event is the
    lift_identifier, followd by the agency abbreviation, and lake
    abbreviation in parenthesis.

    NetLift-1 (USFWS - HU)

    """

    agency_abbrev = "USFWS"
    lake_abbrev = "HU"

    lift_identifier = "Net-1"

    lake = LakeFactory(abbrev=lake_abbrev)
    agency = AgencyFactory(abbrev=agency_abbrev)

    recovery_event = RecoveryEventFactory(
        agency=agency, lake=lake, lift_identifier=lift_identifier
    )

    shouldbe = "{} ({}-{})".format(lift_identifier, agency_abbrev, lake_abbrev)
    assert str(recovery_event) == shouldbe


@pytest.mark.django_db
def test_recovery_event_save():
    """
    When a recovery event is saved, a point geometry should be created
    from the latitude and longitude.
    """

    dd_lat = 44.4
    dd_lon = -81.132

    # create a recovery at our coordinates
    recovery_event = RecoveryEventFactory(dd_lat=dd_lat, dd_lon=dd_lon)

    # calculate what the geom should be using our coordinates
    shouldbe = GEOSGeometry("POINT({} {})".format(dd_lon, dd_lat), srid=4326)

    assert recovery_event.geom == shouldbe


@pytest.mark.django_db
def test_recovery_str():
    """

    Verify that the string representation of a cwt recovery is the
    cwt number followed by the fish_identifier_key


    12-34-56 - Fish-1

    """

    cwt_number = "123456"
    fish_identifier = "Fish-1"

    recovery = RecoveryFactory(
        cwt_number=cwt_number, fish_identifier_key=fish_identifier
    )

    shouldbe = "{}-{}-{} - {}".format(
        cwt_number[:2], cwt_number[2:4], cwt_number[4:], fish_identifier
    )
    assert str(recovery) == shouldbe
