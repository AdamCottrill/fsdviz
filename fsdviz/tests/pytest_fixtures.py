"""=============================================================
~/fsdviz/fsdviz/tests/pytest_fixtures.py
 Created: 28 Aug 2019 11:09:58

 DESCRIPTION:

This file contains a number of fixtures or objects that are used by
our testing utilities.  The object include a user, a dictionary
representing a complete xlsx stocking event, and a list of invalid
excel files and associated error messages.  These objects are included
here because they are used in several other places.

 A. Cottrill
=============================================================

"""


import pytest

# from .user_factory import UserFactory
from fsdviz.myusers.tests.factories import UserFactory
from django.contrib.gis.geos import GEOSGeometry

from .common_factories import (
    AgencyFactory,
    CWTFactory,
    CWTsequenceFactory,
    FinClipFactory,
    FishTagFactory,
    JurisdictionFactory,
    LakeFactory,
    LatLonFlagFactory,
    PhysChemMarkFactory,
    SpeciesFactory,
    StateProvinceFactory,
    StrainFactory,
    StrainRawFactory,
)


from .stocking_factories import (
    DataUploadEventFactory,
    LifeStageFactory,
    HatcheryFactory,
    StockingMethodFactory,
    StockingEventFactory,
)

from fsdviz.common.choices import LATLON_FLAGS

SCOPE = "function"


@pytest.fixture(scope=SCOPE)
def user(db):
    """return a normal user named homer"""
    password = "Abcd1234"
    homer = UserFactory.create(
        username="hsimpson",
        first_name="Homer",
        last_name="Simpson",
        email="homer@simpons.com",
        password=password,
    )
    homer.save()
    return homer


@pytest.fixture(scope=SCOPE)
def superior(db):
    """a fixture for lake superior"""
    superior = LakeFactory(lake_name="Lake Superior", abbrev="SU")
    return superior


@pytest.fixture(scope=SCOPE)
def huron(db):
    """a fixture for lake superior"""
    huron = LakeFactory(lake_name="Lake Huron", abbrev="HU")
    return huron


@pytest.fixture(scope=SCOPE)
def mdnr(db):
    """a fixture for Michigan Department of Natural Resources"""
    mdnr = AgencyFactory(
        abbrev="MDNR", agency_name="Michigan Department of Natural Resources"
    )
    return mdnr


@pytest.fixture(scope=SCOPE)
def usfws(db):
    """a fixture for the US Fish and Wildlife Servce"""
    usfws = AgencyFactory(abbrev="USWFS", agency_name="U.S. Fish and Wildlife Servce")
    return usfws


@pytest.fixture(scope=SCOPE)
def glsc(db):
    """A user who is a great lakes stocking coordinator (role)"""
    glsc = UserFactory(
        username="hsimpson",
        first_name="Homer",
        last_name="Simpson",
        email="homer.simpson@simpsons.com",
        password="Abcd1234",
        role="glsc",
    )
    glsc.save()
    return glsc


@pytest.fixture(scope=SCOPE)
def huron_mdnr_sc(mdnr, huron):
    """A user with role and lake  who is an agency stocking coordinator"""

    huron_mdnr_sc = UserFactory.create(
        username="bsimpson",
        first_name="bart",
        last_name="Simpson",
        email="bart.simpson@simpsons.com",
        password="Abcd1234",
        role="asc",
        agency=mdnr,
        lakes=[huron],
    )
    huron_mdnr_sc.save()
    return huron_mdnr_sc


@pytest.fixture(scope=SCOPE)
def huron_mdnr_user(mdnr, huron):
    """A user with role and lake who is an agency user"""

    huron_mdnr_user = UserFactory.create(
        username="lsimpson",
        first_name="lisa",
        last_name="Simpson",
        email="lisa.simpson@simpsons.com",
        password="Abcd1234",
        role="au",
        agency=mdnr,
        lakes=[huron],
    )

    return huron_mdnr_user


@pytest.fixture(scope=SCOPE)
def stocking_events(usfws, mdnr, superior, huron):
    """A user who is an agency user"""

    mich = StateProvinceFactory(
        abbrev="MI",
        name="Michigan",
        description="The State of Michigan",
        country="US",
    )
    su_mi = JurisdictionFactory(stateprov=mich, lake=superior, slug="su_mi")
    hu_mi = JurisdictionFactory(stateprov=mich, lake=huron, slug="hu_mi")

    event1 = StockingEventFactory(agency=mdnr, jurisdiction=hu_mi)
    event2 = StockingEventFactory(agency=usfws, jurisdiction=hu_mi)
    event3 = StockingEventFactory(agency=mdnr, jurisdiction=su_mi)
    event4 = StockingEventFactory(agency=usfws, jurisdiction=su_mi)

    return [event1, event2, event3, event4]


@pytest.fixture(scope=SCOPE)
def data_uploads(usfws, mdnr, superior, huron):
    """A user who is an agency user"""

    upload1 = DataUploadEventFactory(agency=mdnr, lake=huron)
    upload2 = DataUploadEventFactory(agency=usfws, lake=huron)
    upload3 = DataUploadEventFactory(agency=mdnr, lake=superior)
    upload4 = DataUploadEventFactory(agency=usfws, lake=superior)

    return [upload1, upload2, upload3, upload4]


@pytest.fixture(scope=SCOPE)
def roi(db):
    """a region of interest that can be used in all of our tests.  Uses
    corrdinates of grid 2826, a 5-minute grid in the middle of Lake
    Huron located at the intersection of 44 degrees latitude and 82
    degrees longitude..

    inside the ROI: 'POINT(-82.0456637754061 44.0649121962459)'
    outside the ROI: POINT'(-79.152543, 43.603609)'

    """
    grid = (
        "MULTIPOLYGON(((-82.000000033378 43.9999999705306,"
        + "-82.0833359084557 43.9999999705305,"
        + "-82.0833359084557 44.0833320331081,"
        + "-82.000000033378 44.0833320331082,"
        + "-82.000000033378 43.9999999705306)))"
    )
    roi = GEOSGeometry(grid.replace("\n", ""), srid=4326)

    return roi


@pytest.fixture(scope="function")
def latlon_flags(db):
    """populate the database with our latlon choices."""

    flags = [LatLonFlagFactory(value=x[0], description=x[1]) for x in LATLON_FLAGS]
    return flags


@pytest.fixture(scope="function")
def finclips(db):
    """populate the database some finclips."""

    FIN_CLIPS = (
        ("NO", "No Clip"),
        ("UN", "Unknown Status"),
        ("AD", "Adipose"),
        ("LP", "Left Pectoral"),
        ("RV", "Right Ventral (Pelvic)"),
    )

    finclips = [FinClipFactory(abbrev=x[0], description=x[1]) for x in FIN_CLIPS]
    return finclips


@pytest.fixture(scope="function")
def stocking_event_dict(db):
    """return a dictionary representing a complete, valid upload event.
    This dictionary is used directly to represent a stocking event, or
    is modified to verify that invalid data is handled appropriately.

    """

    event_dict = {
        "stock_id": None,
        "lake": "HU",
        "state_prov": "ON",
        "year": 2015,
        "month": 4,
        "day": 20,
        "site": "Barcelona",
        "st_site": None,
        "latitude": 42.3422418,
        "longitude": -79.5962906,
        "grid": "214",
        "stat_dist": "NC2",
        "species": "LAT",
        "strain": "SLW",
        "no_stocked": 18149,
        "year_class": 2014,
        "stage": "y",
        "agemonth": 18,
        "mark": "ADCWT",
        "mark_eff": 99.5,
        "tag_no": 640599,
        "tag_ret": 99,
        "length": 107.44,
        "weight": 563.8153159,
        "condition": 1,
        "lot_code": "LAT-SLW-13",
        "stock_meth": "b",
        "agency": "MNRF",
        "notes": "FIS ID = 73699",
        # new
        "hatchery": "CFCS",
        "agency_stock_id": "P1234",
    }

    return event_dict


# our list of invalid spreadsheets and their associated messages
invalid_xlsfiles = [
    (
        "fsdviz/tests/xls_files/two_agencies.xlsx",
        (
            "The uploaded file has more than one agency. "
            + " Data submissions are limited to a single year, species, and agency. "
        ),
    ),
    (
        "fsdviz/tests/xls_files/two_lakes.xlsx",
        (
            "The uploaded file has more than one lake. "
            + " Data submissions are limited to a single year, species, and agency. "
        ),
    ),
    (
        "fsdviz/tests/xls_files/two_years.xlsx",
        (
            "The uploaded file has more than one year. "
            + " Data submissions are limited to a single year, species, and agency. "
        ),
    ),
    (
        "fsdviz/tests/xls_files/too_many_records.xlsx",
        "Uploaded file has too many records. Please split it into"
        + "smaller packets (e.g by species).",
    ),
    (
        "fsdviz/tests/xls_files/empty_template.xlsx",
        "The uploaded file does not appear to contain any stocking records!",
    ),
    (
        "fsdviz/tests/xls_files/missing_one_field.xlsx",
        (
            "The uploaded file appears to be missing the field: year_class. "
            + "This field is required in a valid data upload template."
        ),
    ),
    (
        "fsdviz/tests/xls_files/missing_two_fields.xlsx",
        (
            "The uploaded file appears to be missing the fields: stage, year_class. "
            + "These fields are required in a valid data upload template."
        ),
    ),
    (
        "fsdviz/tests/xls_files/one_extra_field.xlsx",
        (
            "The uploaded file appears to have an additional field: extraA. "
            + "This field was ignored."
        ),
    ),
    (
        "fsdviz/tests/xls_files/two_extra_fields.xlsx",
        (
            "The uploaded file appears to have 2 additional field(s): extraA, extraB. "
            + "These fields were ignored."
        ),
    ),
]


@pytest.fixture()
def cwt_stocking_events(db):
    """setup some stocking events with cwts and known attributes. Subsets
    of these records are selected by different cwt_filters."""

    huron = LakeFactory(abbrev="HU", lake_name="Huron")
    superior = LakeFactory(abbrev="SU", lake_name="Superior")
    erie = LakeFactory(abbrev="ER", lake_name="Erie")

    mnrf = AgencyFactory(abbrev="MNRF")
    mdnr = AgencyFactory(abbrev="MDNR")
    odnr = AgencyFactory(abbrev="ODNR")

    mnrf_hatcheryA = HatcheryFactory(
        abbrev="mnrfA", hatchery_name="Ontario A", agency=mnrf
    )
    mnrf_hatcheryB = HatcheryFactory(
        abbrev="mnrfB", hatchery_name="Ontario B", agency=mnrf
    )
    mdnr_hatchery = HatcheryFactory(
        abbrev="mdnrA", hatchery_name="Michigan Hatchery", agency=mdnr
    )
    odnr_hatchery = HatcheryFactory(
        abbrev="odnrA", hatchery_name="Ohio Hatchery", agency=odnr
    )

    ontario = StateProvinceFactory(abbrev="ON", name="Ontario")
    ohio = StateProvinceFactory(abbrev="OH", name="Ohio")
    michigan = StateProvinceFactory(abbrev="MI", name="Michigan")

    mi_hu = JurisdictionFactory(lake=huron, stateprov=michigan)
    on_hu = JurisdictionFactory(lake=huron, stateprov=ontario)
    on_su = JurisdictionFactory(lake=superior, stateprov=ontario)

    oh_er = JurisdictionFactory(lake=erie, stateprov=ohio)
    on_er = JurisdictionFactory(lake=erie, stateprov=ontario)

    lat = SpeciesFactory(abbrev="LAT", common_name="Lake Trout")
    cos = SpeciesFactory(abbrev="COS", common_name="Coho Salmon")
    rbt = SpeciesFactory(abbrev="RBT", common_name="Rainbow Trout")

    lat_strain1 = StrainFactory(
        strain_code="BS", strain_label="Big Sound", strain_species=lat
    )

    rbt_strain = StrainFactory(
        strain_code="GAN", strain_label="Ganaraska", strain_species=rbt
    )

    cos_strain = StrainFactory(
        strain_code="WILD", strain_label="Wild", strain_species=cos
    )

    raw_cos = StrainRawFactory(species=cos, strain=cos_strain, raw_strain="COS-1")
    raw_rbt = StrainRawFactory(species=rbt, strain=rbt_strain, raw_strain="RBT-1")

    raw_lat1 = StrainRawFactory(species=lat, strain=lat_strain1, raw_strain="BS-1")

    fry = LifeStageFactory(abbrev="fry", description="fry")
    fingerlings = LifeStageFactory(abbrev="f", description="fingerlings")
    yearlings = LifeStageFactory(abbrev="y", description="yearlings")

    boat = StockingMethodFactory(stk_meth="b", description="boat")
    truck = StockingMethodFactory(stk_meth="t", description="truck")
    plane = StockingMethodFactory(stk_meth="p", description="plane")

    ox_mark = PhysChemMarkFactory(mark_code="OX")
    ca_mark = PhysChemMarkFactory(mark_code="CA")

    floy_tag = FishTagFactory(
        tag_code="FTR", tag_type="Floy", description="Red Floy Tag"
    )

    jaw_tag = FishTagFactory(tag_code="JAW", tag_type="Jaw", description="Jaw Tag")

    rp_clip = FinClipFactory.create(abbrev="RP", description="right pect")
    lp_clip = FinClipFactory.create(abbrev="LP", description="left pect")
    rv_clip = FinClipFactory.create(abbrev="RV", description="right ventral")

    # pt1 is in our ROI, pt2 is outside
    pt1 = GEOSGeometry("POINT(-82.0 44.0)", srid=4326)
    pt2 = GEOSGeometry("POINT(-81.0 46.0)", srid=4326)

    cwt1 = CWTFactory(cwt_number="111111")
    cwtseq1 = CWTsequenceFactory(cwt=cwt1)

    event1 = StockingEventFactory(
        stock_id="1111",
        jurisdiction=on_hu,
        agency=mnrf,
        year=2010,
        year_class=2009,
        month=4,
        day=15,
        species=lat,
        strain_raw=raw_lat1,
        lifestage=yearlings,
        stocking_method=plane,
        hatchery=mnrf_hatcheryA,
        dd_lon=pt1.x,
        dd_lat=pt1.y,
    )
    cwtseq1.events.add(event1)
    cwtseq1.save()

    event1.fish_tags.add(floy_tag)
    event1.physchem_marks.add(ox_mark)
    event1.fin_clips.add(rp_clip)
    event1.save()

    cwt2 = CWTFactory(cwt_number="222222")
    cwtseq2 = CWTsequenceFactory(cwt=cwt2)

    event2 = StockingEventFactory(
        stock_id="2222",
        jurisdiction=mi_hu,
        agency=mdnr,
        year=2010,
        year_class=2010,
        month=6,
        day=15,
        species=cos,
        strain_raw=raw_cos,
        lifestage=fingerlings,
        stocking_method=boat,
        hatchery=mdnr_hatchery,
        dd_lon=pt1.x,
        dd_lat=pt1.y,
    )

    cwtseq2.events.add(event2)
    cwtseq2.save()

    event2.fish_tags.add(floy_tag)
    event2.physchem_marks.add(ox_mark)
    event2.fin_clips.add(rp_clip)
    event2.save()

    cwt3 = CWTFactory(cwt_number="333333")
    cwtseq3 = CWTsequenceFactory(cwt=cwt3)

    event3 = StockingEventFactory(
        stock_id="3333",
        jurisdiction=on_er,
        agency=mnrf,
        year=2012,
        year_class=2011,
        month=None,
        day=None,
        species=lat,
        strain_raw=raw_lat1,
        lifestage=yearlings,
        stocking_method=boat,
        hatchery=mnrf_hatcheryB,
        dd_lon=pt1.x,
        dd_lat=pt1.y,
    )

    cwtseq3.events.add(event3)
    cwtseq3.save()

    event3.fish_tags.add(floy_tag)
    event3.physchem_marks.add(ca_mark)
    event3.fin_clips.add(lp_clip, rp_clip)
    event3.save()

    cwt4 = CWTFactory(cwt_number="444444")
    cwtseq4 = CWTsequenceFactory(cwt=cwt4)

    event4 = StockingEventFactory(
        stock_id="4444",
        jurisdiction=oh_er,
        agency=odnr,
        year=2008,
        year_class=2008,
        month=8,
        day=15,
        species=rbt,
        strain_raw=raw_rbt,
        lifestage=fry,
        stocking_method=truck,
        hatchery=odnr_hatchery,
        dd_lon=pt2.x,
        dd_lat=pt2.y,
    )

    cwtseq4.events.add(event4)
    cwtseq4.save()

    event4.fish_tags.add(jaw_tag)
    event4.physchem_marks.add(ca_mark)
    event4.fin_clips.add(lp_clip, rv_clip)
    event4.save()

    # lake trout stocked in Lake Superior
    cwt5 = CWTFactory(cwt_number="551111", manufacturer="mm")
    cwtseq5 = CWTsequenceFactory(cwt=cwt5)

    event5 = StockingEventFactory(
        stock_id="5555",
        jurisdiction=on_su,
        agency=mnrf,
        year=2050,
        year_class=2049,
        month=6,
        day=15,
        species=lat,
        strain_raw=raw_lat1,
        lifestage=yearlings,
        stocking_method=plane,
        hatchery=mnrf_hatcheryB,
        dd_lon=pt2.x,
        dd_lat=pt2.y,
    )
    cwtseq5.events.add(event5)
    cwtseq5.save()

    # no marks, clips only.
    event5.fin_clips.add(rp_clip, rv_clip)
    event5.save()

    # rainbow trout stocked in Lake Superior
    cwt6 = CWTFactory(cwt_number="111166", tag_type="sequential")
    cwtseq6 = CWTsequenceFactory(cwt=cwt6)

    # no marks or clips
    event6 = StockingEventFactory(
        stock_id="6666",
        jurisdiction=on_su,
        agency=mnrf,
        year=2008,
        year_class=2008,
        month=8,
        day=15,
        species=rbt,
        strain_raw=raw_rbt,
        lifestage=fry,
        stocking_method=truck,
        hatchery=mnrf_hatcheryB,
        dd_lon=pt2.x,
        dd_lat=pt2.y,
    )

    cwtseq6.events.add(event6)
    cwtseq6.save()


# these are the list filters, expected and excluded cwt numbers - used
# with cwt_stocking_events fixture to ensure filters and views return the
# expected result.

# The fourth element of each tuple is an option, prefetch_related
# string that can be passed to the queryset to make the tests more efficient.

# the filter tuples are presented here in the same order as they are
# defined in ~/common/filters.py which closely follow the order
# associated with the stocking event filter.


cwt_parameters = [
    (
        {"cwt_number_like": "1111"},
        ["111111", "551111", "111166"],
        ["222222", "333333", "444444"],
        None,
    ),
    (
        {"cwt_number": "551111"},
        [
            "551111",
        ],
        ["111111", "222222", "333333", "444444", "111166"],
        None,
    ),
    (
        {"cwt_number": "551111,111166"},
        ["551111", "111166"],
        ["111111", "222222", "333333", "444444"],
        None,
    ),
    (
        {"tag_type": "sequential"},
        ["111166"],
        ["111111", "551111", "222222", "333333", "444444"],
        None,
    ),
    (
        {"manufacturer": "mm"},
        ["551111"],
        ["111111", "111166", "222222", "333333", "444444"],
        None,
    ),
    (
        {"lake": "HU"},
        ["111111", "222222"],
        ["333333", "4444444", "551111", "111166"],
        "events__jurisdiction__lake",
    ),
    (
        {"lake": "HU,ER"},
        ["111111", "222222", "333333", "444444"],
        ["551111", "111166"],
        "events__jurisdiction__lake",
    ),
    (
        {"agency": "MNRF"},
        ["111111", "333333", "551111", "111166"],
        ["444444", "222222"],
        "events__agency",
    ),
    (
        {"agency": "ODNR,MDNR"},
        ["444444", "222222"],
        ["111111", "333333", "551111", "111166"],
        "events__agency",
    ),
    (
        {"stateprov": "ON"},
        ["111111", "333333", "551111", "111166"],
        ["222222", "444444"],
        "events__jurisdiction__stateprov",
    ),
    (
        {"stateprov": "MI,OH"},
        ["222222", "444444"],
        ["111111", "333333", "551111", "111166"],
        "events__jurisdiction__stateprov",
    ),
    (
        {"jurisdiction": "su_on"},
        ["551111", "111166"],
        ["111111", "333333", "222222", "444444"],
        "events__jurisdiction",
    ),
    (
        {"jurisdiction": "hu_on, er_oh"},
        ["111111", "444444"],
        ["551111", "333333", "222222", "111166"],
        "events__jurisdiction",
    ),
    (
        {"first_year": "2010"},
        ["111111", "222222", "333333", "551111"],
        ["444444", "111166"],
        "events",
    ),
    (
        {"last_year": "2010"},
        ["111111", "222222", "444444", "111166"],
        ["333333", "551111"],
        "events",
    ),
    (
        {"first_year": "2009", "last_year": "2011"},
        ["111111", "222222"],
        ["333333", "551111", "444444", "111166"],
        "events",
    ),
    (
        {"year": "2010"},
        ["111111", "222222"],
        ["333333", "444444", "551111", "111166"],
        "events",
    ),
    (
        {"year_class": "2008"},
        ["444444", "111166"],
        [
            "111111",
            "222222",
            "333333",
            "551111",
        ],
        "events",
    ),
    (
        {"year_class": "2009,2010,2011"},
        ["111111", "222222", "333333"],
        ["444444", "551111", "111166"],
        "events",
    ),
    (
        {"stocking_month": "4"},
        [
            "111111",
        ],
        ["222222", "333333", "444444", "551111", "111166"],
        "events",
    ),
    (
        {"stocking_month": "99"},
        [
            "333333",
        ],
        ["111111", "222222", "444444", "551111", "111166"],
        "events",
    ),
    (
        {"stocking_month": "4,99"},
        ["111111", "333333"],
        ["222222", "444444", "551111", "111166"],
        "events",
    ),
    (
        {"stocking_month": "4,6"},
        ["111111", "222222", "551111"],
        ["333333", "444444", "111166"],
        "events",
    ),
    (
        {"species": "LAT"},
        ["111111", "333333", "551111"],
        ["222222", "444444", "111166"],
        "events__species",
    ),
    (
        {"species": "RBT,COS"},
        ["222222", "444444", "111166"],
        ["111111", "333333", "551111"],
        "events__species",
    ),
    (
        {"strain_name": "BS"},
        ["111111", "333333", "551111"],
        ["222222", "444444", "111166"],
        "events__species",
    ),
    (
        {"strain_name": "GAN,WILD"},
        ["222222", "444444", "111166"],
        ["111111", "333333", "551111"],
        "events__species",
    ),
    # strain_id
    (
        {"stocking_method": "b"},
        ["222222", "333333"],
        ["111111", "444444", "111166", "551111"],
        "events__stocking_method",
    ),
    (
        {"stocking_method": "p,t"},
        ["111111", "444444", "111166", "551111"],
        ["222222", "333333"],
        "events__stocking_method",
    ),
    (
        {"lifestage": "y"},
        ["111111", "333333", "551111"],
        ["222222", "444444", "111166"],
        "events__lifestage",
    ),
    (
        {"lifestage": "fry,f"},
        ["222222", "444444", "111166"],
        ["111111", "333333", "551111"],
        "events__lifestage",
    ),
    (
        {"fin_clips": "RP"},
        ["111111", "222222", "333333", "551111"],
        ["111166", "444444"],
        "events__fin_clips",
    ),
    (
        {"fin_clips": "RP,XX"},
        ["111111", "222222", "333333", "551111"],
        ["111166", "444444"],
        "events__fin_clips",
    ),
    (
        {"physchem_marks": "CA"},
        ["333333", "444444"],
        ["111111", "222222", "111166", "551111"],
        "events__physchem_marks",
    ),
    (
        {"physchem_marks": "CA,OX"},
        ["111111", "222222", "333333", "444444"],
        ["111166", "551111"],
        "events__physchem_marks",
    ),
    (
        {"clip_code": "RP"},
        ["111111", "222222"],
        ["333333", "444444", "111166", "551111"],
        "events",
    ),
    (
        {"clip_code": "RP,LPRV"},
        [
            "111111",
            "222222",
            "444444",
        ],
        ["333333", "111166", "551111"],
        "events",
    ),
    (
        {"fishtags": "FTR"},
        ["111111", "222222", "333333"],
        ["444444", "111166", "551111"],
        "events__fish_tags",
    ),
    (
        {"fishtags": "FTR,JAW"},
        ["111111", "222222", "333333", "444444"],
        ["111166", "551111"],
        "events__fish_tags",
    ),
    (
        {"hatchery": "mnrfB"},
        ["333333", "111166", "551111"],
        [
            "111111",
            "222222",
            "444444",
        ],
        "events__hatchery",
    ),
    (
        {"hatchery": "mnrfA,odnrA"},
        ["111111", "444444"],
        ["222222", "333333", "111166", "551111"],
        "events__hatchery",
    ),
    # roi
]
