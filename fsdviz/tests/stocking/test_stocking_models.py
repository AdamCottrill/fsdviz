"""
Tests for the models in the stocking application - stocking
events, stocking methods, ect.

"""

from datetime import datetime, UTC
import pytest

from django.contrib.gis.geos import GEOSGeometry

from ...common.utils import is_uuid4
from ...common.models import LatLonFlag

from ...stocking.models import StockingEvent

from ..pytest_fixtures import latlon_flags, finclips

from ..factories.common_factories import (
    AgencyFactory,
    SpeciesFactory,
    LakeFactory,
    Grid10Factory,
    StateProvinceFactory,
    JurisdictionFactory,
    FinClipFactory,
    PhysChemMarkFactory,
    CWTFactory,
    CWTsequenceFactory,
)

from fsdviz.myusers.tests.factories import UserFactory

from ..factories.stocking_factories import (
    LifeStageFactory,
    StockingMortalityFactory,
    StockingMethodFactory,
    HatcheryFactory,
    StockingEventFactory,
    DataUploadEventFactory,
    YearlingEquivalentFactory,
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
def test_yearing_equivalent_str():
    """
    Verify that the string representation of a yearling equivalent object is the
    speciesd folloed the life stage followed by the conversion factor:.

    Lake Trout (LAT) [Fall Fingerlings (ff)]: 0.010

    """

    species_name = "Lake Trout"
    species_abbrev = "LAT"
    species = SpeciesFactory(abbrev=species_abbrev, common_name=species_name)

    lifestage_abbrev = "ff"
    lifestage_description = "Fall Fingerling"
    lifestage = LifeStageFactory(
        abbrev=lifestage_abbrev, description=lifestage_description
    )

    yreq_factor = 0.01

    yreq = YearlingEquivalentFactory(
        species=species, lifestage=lifestage, yreq_factor=yreq_factor
    )

    shouldbe = "{} ({}) [{} ({})]: {:.3f}".format(
        species_name,
        species_abbrev,
        lifestage_description,
        lifestage_abbrev,
        yreq_factor,
    )
    assert str(yreq) == shouldbe


@pytest.mark.django_db
def test_stocking_mortality_str():
    """
    Verify that the string representation of a stocking_mortality object is the
    value followed by the stocking_mortality description:

    1 - <1% mortality observed, "excellent"

    """

    stocking_mortality_code = 1
    description = '<1% mortality observed, "excellent"'

    stocking_mortality = StockingMortalityFactory()

    shouldbe = "{} - {}".format(stocking_mortality_code, description)
    assert str(stocking_mortality) == shouldbe


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
def test_hatchery_wo_agency_str():
    """Verify that the string representation of a hatchery object that
    does not have an associated agency is the hatchery name followed
    by the abbreviation in parentheses.

    Chatsworth Fish Culture Station (CWC)

    """

    abbrev = "CWC"
    hatchery_name = "Chatsworth Fish Culture Station"

    obj = HatcheryFactory(abbrev=abbrev, hatchery_name=hatchery_name, agency=None)

    shouldbe = "{} ({})".format(hatchery_name, abbrev)
    assert str(obj) == shouldbe


@pytest.mark.django_db
def test_hatchery_with_agency_str():
    """Verify that the string representation of a hatchery object that
    has an associated agency is the hatchery name followed
    by the abbreviation and agency abbreviation in parentheses:

    Chatsworth Fish Culture Station (CWC [OMNRF])

    """

    agency_abbrev = "OMNRF"
    agency = AgencyFactory(abbrev=agency_abbrev)

    abbrev = "CWC"
    hatchery_name = "Chatsworth Fish Culture Station"

    obj = HatcheryFactory(abbrev=abbrev, hatchery_name=hatchery_name, agency=agency)

    shouldbe = "{} ({} [{}])".format(hatchery_name, abbrev, agency_abbrev)
    assert str(obj) == shouldbe


@pytest.mark.django_db
def test_hatchery_wo_agency_short_name():
    """Verify that the short name method of a hatchery object that
    does not have an associated agency is the hatchery name followed
    by the abbreviation in parentheses without the "Fish Culture Station"

    Chatsworth (CWC)

    """

    abbrev = "CWC"
    hatchery_name = "Chatsworth Fish Culture Station"

    obj = HatcheryFactory(abbrev=abbrev, hatchery_name=hatchery_name, agency=None)

    shouldbe = "{} ({})".format(hatchery_name, abbrev).replace(
        "Fish Culture Station", ""
    )
    assert obj.short_name() == shouldbe


@pytest.mark.django_db
def test_hatchery_with_agency_short_name():
    """Verify that the shore_name method of a hatchery object that
    has an associated agency is the hatchery name followed
    by the abbreviation and agency abbreviation in parentheses:

    Chatsworth (CWC [OMNRF])

    """

    agency_abbrev = "OMNRF"
    agency = AgencyFactory(abbrev=agency_abbrev)

    abbrev = "CWC"
    hatchery_name = "Chatsworth Fish Culture Station"

    obj = HatcheryFactory(abbrev=abbrev, hatchery_name=hatchery_name, agency=agency)

    shouldbe = "{} ({} [{}])".format(hatchery_name, abbrev, agency_abbrev).replace(
        "Fish Culture Station", ""
    )
    assert obj.short_name() == shouldbe


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

    right_now = datetime.now(UTC)
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

    right_now = datetime.now(UTC)
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


@pytest.mark.django_db
def test_event_lake_method():
    """The stocking event model has a property .lake that should return
    the lake associated with the stocking event.

    """
    lake = LakeFactory(lake_name="Huron", abbrev="HU")
    stateprov = StateProvinceFactory(name="Ontario")
    jurisdiction = JurisdictionFactory(lake=lake, stateprov=stateprov)
    event = StockingEventFactory(jurisdiction=jurisdiction)
    assert event.lake == lake


@pytest.mark.django_db
def test_event_stateprov_method():
    """The stocking event model has a property .stateprov that should return
    the lake associated with the stocking event.
    """

    lake = LakeFactory(lake_name="Huron", abbrev="HU")
    stateprov = StateProvinceFactory(name="Ontario")
    jurisdiction = JurisdictionFactory(lake=lake, stateprov=stateprov)
    event = StockingEventFactory(jurisdiction=jurisdiction)
    assert event.stateprov == stateprov


@pytest.mark.django_db
def test_get_finclip_code():
    """The stocking event object has a method that will return the clip
    codes that were applied to the fish stocked in the event. the
    component clip codes should first be sorted and then concatentated
    to ensure that we don't get values like 'LPRV' and 'RVLP'
    """

    lp = FinClipFactory(abbrev="LP", description="Left Pectoral")
    rv = FinClipFactory(abbrev="RV", description="Right Ventral")

    event = StockingEventFactory()
    event.fin_clips.add(lp, rv)
    event.save()

    assert event.get_finclip_code() == "LPRV"


@pytest.mark.django_db
def test_get_physchem_mark_code():
    """The stocking event object has a method that will return the clip
    codes that were applied to the fish stocked in the event. the
    component clip codes should first be sorted and then concatentated
    to ensure that we don't get values like 'LPRV' and 'RVLP'
    """

    ox = PhysChemMarkFactory(mark_code="OX", description="oxytetracycline")
    dy = PhysChemMarkFactory(mark_code="DY", description="dy, general")

    event = StockingEventFactory()
    event.physchem_marks.add(ox, dy)
    event.save()

    assert event.get_physchem_code() == "DYOX"


@pytest.mark.django_db
def test_event_has_sequentail_cwts():
    """Sequential cwt tags are going to cause grief.  The stocking event
    object has a method that returns a boolean that is true if this event
    has at least one sequential cwt associated with it, and false
    otherwise.
    """

    # not cwts at all:
    event1 = StockingEventFactory()
    assert event1.has_sequential_cwts is False

    # regular cwts, but no sequential tags:
    cwt = CWTFactory(tag_type="cwt")
    cwt_series = CWTsequenceFactory(cwt=cwt)
    event2 = StockingEventFactory()
    event2.cwt_series.add(cwt_series)
    event2.save()
    assert event2.has_sequential_cwts is False

    # sequential tags:
    scwt = CWTFactory(tag_type="sequential")
    scwt_series = CWTsequenceFactory(cwt=scwt)
    event3 = StockingEventFactory()
    event3.cwt_series.add(scwt_series)
    event3.save()
    assert event3.has_sequential_cwts is True


@pytest.mark.django_db
def test_stocking_event_date_from_day_month_year():
    """When a stocking event is saved, its day month and year values
     should be converted to a date if possible, and saved in the date
    field.

     This should be converted to a parameterized test that takes a
     list of day, month, year, and expected date values.

    """

    event_date = datetime(year=2010, month=8, day=12)
    event = StockingEventFactory(year=2010, month=8, day=12)
    event.save()
    assert event.date == event_date

    event = StockingEventFactory(date=None, day=None, month=8, year=2010)
    event.save()
    assert event.date is None

    event = StockingEventFactory(date=None, day=None, month=None, year=2010)
    event.save()
    assert event.date is None


@pytest.mark.django_db
def test_best_stocking_event_date():
    """The stocking event model has a method that is supposed to return
    the best available date, given that the day, or day and month may be
    null.

    The method should return the complete date if it is available, the
    month and the year if the day is unknown, or just the year if
    the month and date are not known. Returns a string representing
    the date of the form "August 12, 2010", "August 2010", or "2010"

    This should be converted to a parameterized test that takes a
    list of day, month, year, and expected date values.

    """

    event_date = datetime(year=2010, month=8, day=12)
    event = StockingEventFactory(
        year=event_date.year, month=event_date.month, day=event_date.day
    )
    assert event.best_date_str() == "August 12, 2010"

    event = StockingEventFactory(date=None, day=None, month=8, year=2010)
    assert event.best_date_str() == "August 2010"

    event = StockingEventFactory(date=None, day=None, month=None, year=2010)
    assert event.best_date_str() == "2010"


@pytest.mark.django_db
def test_stocking_event__lat__lon_from_reported_lat_lon():
    """The stocking event model has two non-editable fields _lat and _lon
    that are updated with corridinates of the geometry when the
    stocking event is saved. These fields are used by the serializers
    to provide better performance as Point objects are not easily
    serialized outside of a model serializer, which is painfully slow
    for a large number of objects.

    """

    dd_lat = 45.125
    dd_lon = -81.125
    event = StockingEventFactory(dd_lat=dd_lat, dd_lon=dd_lon)
    event.save()

    # our reported lat-lon are accurate
    assert event.dd_lon == dd_lon
    assert event.dd_lat == dd_lat

    # our internal lat-lon are accurate too:
    assert event.geom_lon == dd_lon
    assert event.geom_lat == dd_lat


@pytest.mark.django_db
def test_stocking_event__lat__lon_from_grid10(latlon_flags):
    """The stocking event model has two non-editable fields _lat and _lon
    that are updated with corridinates of the geometry when the
    stocking event is saved.  If lat-lon are not provided, they should
    be derived from the centroid of the grid.

    This test requires the latlon_flag becuase a relationship is
    created when the internal coordinates are populated form the grid
    centoid.

    """

    grid10 = Grid10Factory()
    event = StockingEventFactory(dd_lat=None, dd_lon=None, grid_10=grid10)
    event.save()

    # the reported lat-lon should be none:
    assert event.dd_lon is None
    assert event.dd_lat is None

    # the internal lat-lon values should be the same as our grid:
    assert event.geom_lon == grid10.centroid.x
    assert event.geom_lat == grid10.centroid.y


@pytest.mark.django_db
def test_stocking_event_latlon_flag(latlon_flags):
    """When a stocking event is saved, the latlon_flag should be set to
    indicate the precision of the spatial information. The latlon_flag
    indicates the finest level of resultion provided for each event (the
    lower the flag, the more precise the spatial information is).

    """

    flag_cache = {x.value: x for x in LatLonFlag.objects.all()}

    grid10 = Grid10Factory()

    event = StockingEventFactory(dd_lat=45.1, dd_lon=-81.1, grid_10=grid10)
    event.save()
    assert event.latlong_flag == flag_cache[1]

    event.dd_lat = None
    event.dd_lon = None
    event.geom = None
    event.save()
    # assert event.latlong_flag == flag_cache[3]
    # event.grid5 = None
    event.save()
    assert event.latlong_flag == flag_cache[4]

    # grid 10 is a required field in the current database. If this
    # changes we will have to add additional tests here.  these ones
    # don't work because we can't save an event without a grid.

    # event.grid_10 = None
    # event.save()
    # assert event.latlong_flag == flag_cache[5]

    # event.management_unit = None
    # event.save()
    # assert event.latlong_flag == flag_cache[6]


@pytest.mark.django_db
def test_stocking_event_yearling_equivalents():
    """When a stocking event is saved, the number of yearling equivalents
    should be calculated based on other attributes in the event.  If
    yearling equivalents cannot be calcualted, this value should be the
    same as number stocked.

    """

    species = SpeciesFactory()
    lifestage = LifeStageFactory()
    yreq_factor = 0.01

    yreq = YearlingEquivalentFactory(
        species=species, lifestage=lifestage, yreq_factor=yreq_factor
    )

    event = StockingEventFactory(species=species, lifestage=lifestage, no_stocked=1000)
    event.save()

    assert event.yreq_stocked == event.no_stocked * yreq_factor


@pytest.mark.django_db
def test_stocking_event_yearling_equivalents_unknown():
    """If the stocking event is assocaited with a species or lifestage
    that does exist (which should never happen), a yearling equivalent
    value of 1 should b eused by default to ensure that things don't
    blow-up.


    """

    species = SpeciesFactory()
    lifestage1 = LifeStageFactory(abbrev="fry", description="fry")
    lifestage2 = LifeStageFactory(abbrev="y", description="yearling")
    yreq_factor = 0.01

    yreq = YearlingEquivalentFactory(
        species=species, lifestage=lifestage1, yreq_factor=yreq_factor
    )

    event = StockingEventFactory(species=species, lifestage=lifestage2, no_stocked=1000)
    event.save()

    # no matching yearling equivalent defaults to 1
    assert event.yreq_stocked == event.no_stocked


@pytest.mark.django_db
def test_yearing_equivalent_poot_save_signal():
    """The yearling equivalent model has post save signal that update the
    corresponding stocking events with the new value when it is saved.

    """

    lake_trout = SpeciesFactory(abbrev="LAT", common_name="Lake Trout")
    walleye = SpeciesFactory(abbrev="WAL", common_name="Walleye")

    lifestage = LifeStageFactory(abbrev="y", description="yearling")

    YearlingEquivalentFactory(species=lake_trout, lifestage=lifestage, yreq_factor=1.0)

    yreq_wal = YearlingEquivalentFactory(
        species=walleye, lifestage=lifestage, yreq_factor=1.0
    )

    event_lat = StockingEventFactory(
        species=lake_trout, lifestage=lifestage, no_stocked=1000
    )
    event_lat.save()

    event_wal = StockingEventFactory(
        species=walleye, lifestage=lifestage, no_stocked=1000
    )
    event_wal.save()

    assert event_lat.yreq_stocked == 1000
    assert event_wal.yreq_stocked == 1000

    yreq_wal.yreq_factor = 0.5
    yreq_wal.save()

    event_lat = StockingEvent.objects.get(species=lake_trout)
    assert event_lat.yreq_stocked == 1000
    event_wal = StockingEvent.objects.get(species=walleye)
    # should be half what it was:
    assert event_wal.yreq_stocked == 500


args = [
    (["LP", "RV"], "LPRV"),
    (["RV", "LP"], "LPRV"),
    (["RV", "LP", "AD"], "ADLPRV"),
    ([], None),
    (["NC", "LP"], "NC"),
    (["UN", "LP"], "UN"),
]


@pytest.mark.parametrize("clip_codes, expected", args)
@pytest.mark.django_db
def test_event_get_composite_clip_code(finclips, clip_codes, expected):
    """The get_composte_clip_code() method of a stocking event combines
    the individual finclips associated with an event, creates or
    retrieves the associated record from the composite fin clip table.

    + If the list of fin clips is emtpy, the method should return None,

    + if the list of finclips includes NC - it should return "No Fin
    Clip", regardless of any other codes (No clip is exclusive of all
    other clip codes)

    + if the list of finclips includes UN - it should return "Unknown
    clip code status", regardless of any other codes (unknown is exclusive of all
    other clip codes)

    + if multiple fin clips are assocaited with and event, the
    composite fin clip will always be the ascii sorted list of fin
    clip abbreviations (LP + RV will allways be returned as LVRP)

    """

    clip_cache = {x.abbrev: x for x in finclips}

    event = StockingEventFactory()
    event.fin_clips.set([clip_cache.get(x, None) for x in clip_codes])
    event.save()
    cclip = event.get_composite_clip_code()

    if expected:
        assert cclip.clip_code == expected
    else:
        assert cclip is None


@pytest.mark.django_db
def test_glfsd_stock_id():
    """When a stocking object is created, if the stock_id is null, it will
    be populated with a string when it is first saved (the pk is
    null).  when it is saved a second time the sstock_id will be
    updated with a string that is composed of the current (creation
    year) and the last five digits of the event's pk.

    """
    event = StockingEventFactory()
    uuid = event.stock_id
    assert is_uuid4(event.stock_id)
    event.save()
    counter = str(event.pk).zfill(5)[-5:]
    yr = str(datetime.now().year)
    expected = yr + counter
    assert event.stock_id == expected
    assert event.stock_id != uuid


@pytest.mark.django_db
def test_existing_stock_id_maintained():
    """When a stocking object is created from an existing record (i.e. -
    migration from ms access, it will be used), event after saving the
    event two or more times.

    """
    orig_id = "201812345"
    event = StockingEventFactory(stock_id=orig_id)
    # the original stock_id should be used
    assert event.stock_id == orig_id

    # still the same after being saved
    event.save()
    assert event.stock_id == orig_id
