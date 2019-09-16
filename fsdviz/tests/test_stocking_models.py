"""
Tests for the models in the stocking application - stocking
events, stocking methods, ect.

"""

from datetime import datetime
import pytest

from .common_factories import AgencyFactory, SpeciesFactory, LakeFactory
from .user_factory import UserFactory

from .stocking_factories import (
    LifeStageFactory,
    ConditionFactory,
    StockingMethodFactory,
    StockingEventFactory,
    DataUploadEventFactory,
)


@pytest.mark.django_db
def test_lifestage_str():
    """
    Verify that the string representation of a life stage object is the
    life stage followed by the abbreviation in parentheses.

    Fall Fingerlings (ff)

    """

    abbrev = "ff"
    description = "Fall Fingerling"

    lifestage = LifeStageFactory(abbrev=abbrev, description=description)

    shouldbe = "{} ({})".format(description, abbrev)
    assert str(lifestage) == shouldbe


@pytest.mark.django_db
def test_condition_str():
    """
    Verify that the string representation of a condition object is the
    value followed by the condition description:

    1 - <1% mortality observed, "excellent"

    """

    condition_code = 1
    description = '<1% mortality observed, "excellent"'

    condition = ConditionFactory(condition=condition_code, description=description)

    shouldbe = "{} - {}".format(condition_code, description)
    assert str(condition) == shouldbe


@pytest.mark.django_db
def test_stockingmethod_str():
    """
    Verify that the string representation of a StockingMethod object is the
    method description followed by the abbreviation in parentheses:

    "inshore stocking, up tributaries (i)"

    """

    stk_meth = "i"
    description = "inshore stocking, up tributaries"

    stockingmethod = StockingMethodFactory(stk_meth=stk_meth, description=description)

    shouldbe = "{} ({})".format(description, stk_meth)
    assert str(stockingmethod) == shouldbe


@pytest.mark.django_db
def test_stockingevent_str():
    """
    Verify that the string representation of a StockingEvent object is the
    stocking id, agency, species and site name

    "id:USFWS-12345 (The Reef-USFWS-LT)"

    """

    event_id = "USFWS-12345"
    site_name = "The Reef"
    agency_abbrev = "USFWS"
    spc_abbrev = "LAT"

    agency = AgencyFactory(abbrev=agency_abbrev)
    species = SpeciesFactory(abbrev=spc_abbrev)

    #                         species_code=80,
    #                         common_name='LakeTrout')

    stocking_event = StockingEventFactory(
        agency=agency, species=species, stock_id=event_id, site=site_name
    )

    shouldbe = "id:{} ({}-{}-{})".format(event_id, site_name, agency_abbrev, spc_abbrev)
    assert str(stocking_event) == shouldbe


@pytest.mark.django_db
def test_datauploadevent_str():
    """Verify that the string representation of a data upload event
    object is the agency abbreviation, folled by the lake
    abbreviation, followed by the date and time in brackets.

    "HU-OMNR (Sep-08-19 10:45)"

    """

    agency_abbrev = "OMNR"
    lake_abbrev = "HU"

    right_now = datetime.utcnow()
    date_string = right_now.strftime("%b %d %Y %H:%M")

    expected = "{}-{} ({})".format(lake_abbrev, agency_abbrev, date_string)

    agency = AgencyFactory(abbrev=agency_abbrev)
    lake = LakeFactory(abbrev=lake_abbrev)
    user = UserFactory()

    datauploadevent = DataUploadEventFactory(uploaded_by=user, lake=lake, agency=agency)

    assert str(datauploadevent) == expected


@pytest.mark.django_db
def test_datauploadevent_generate_slug():
    """Verify that the slug created a data upload event object is the
    agency abbreviation, folled by the lake abbreviation, followed by
    the date and time.  All separated by dashes and in lowercase.

    "hu-omnr-sep-08-19-1045"

    """

    agency_abbrev = "OMNR"
    lake_abbrev = "HU"

    right_now = datetime.utcnow()
    date_string = right_now.strftime("%b %d %Y %H:%M")

    expected = (
        "{}-{}-{}".format(lake_abbrev, agency_abbrev, date_string)
        .lower()
        .replace(" ", "-")
        .replace(":", "")
    )

    agency = AgencyFactory(abbrev=agency_abbrev)
    lake = LakeFactory(abbrev=lake_abbrev)
    user = UserFactory()

    datauploadevent = DataUploadEventFactory(uploaded_by=user, lake=lake, agency=agency)

    assert datauploadevent.generate_slug() == expected
