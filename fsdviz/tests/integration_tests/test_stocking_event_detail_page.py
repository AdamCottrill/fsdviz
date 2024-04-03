"""=============================================================
~/fsdviz/tests/integration_tests/test_stocking_event_detail_page.py
 Created: 11 May 2020 10:02:15

 DESCRIPTION:

  The tests in this script ensure that all of the specific elements of
  the stocking event detail page render as expected.

  the stocking event detail page must contain:
    + stock_id
    + agency stock_id (if known)
    + species
    + strain
    + raw strain
    + agency
    + lake
    + state/province
    + site name
    + 10 minute grid
    + latlong flag
    + stocking date (if known)
    + stocking method
    + lifestage
    + age of stocked fish
    + year class
    + length
    + weight
    + Clips  (if any)
    + tags  (if any)
    + tag retention
    + marks  (if any)
    + marking efficency
    + condition
    + number stocked
    + yearing equivalents
    + lot code
    + validation
    + notes (if any)

    + cwt numbers (if any)

    + Edit Event button if the user has sufficienct priveledges



 A. Cottrill
=============================================================

"""


import pytest
from django.urls import reverse
from datetime import datetime

from pytest_django.asserts import assertTemplateUsed, assertContains, assertNotContains

from ..pytest_fixtures import glsc as user

from ..factories.stocking_factories import (
    StockingEventFactory,
    LifeStageFactory,
    ConditionFactory,
    HatcheryFactory,
    StockingMethodFactory,
)

from ..factories.common_factories import (
    LakeFactory,
    SpeciesFactory,
    AgencyFactory,
    StateProvinceFactory,
    JurisdictionFactory,
    ManagementUnitFactory,
    Grid10Factory,
    StrainFactory,
    StrainRawFactory,
    MarkFactory,
    LatLonFlagFactory,
    CWTFactory,
    CWTsequenceFactory,
    CompositeFinClipFactory,
    FinClipFactory,
    FishTagFactory,
    PhysChemMarkFactory,
)


@pytest.fixture(scope="function")
def base_event():
    """A pytest fixture for a stocking event that will have just the
    manditory fields and associated tables filled - all of the
    optional details will not be rendered in the template will be
    present when this event displayed. The missing parts should be
    handled appropriately.


    """
    stock_id = "2019_12345"

    lake = LakeFactory(lake_name="Huron", abbrev="HU")
    agency = AgencyFactory(
        abbrev="OMNRF", agency_name="Ontario Ministry of Natural Resources and Forestry"
    )
    stateprov = StateProvinceFactory(abbrev="ON", name="Ontario")
    jurisdiction = JurisdictionFactory(lake=lake, stateprov=stateprov)
    grid_10 = Grid10Factory(grid="1234", lake=lake)
    latlong_flag = LatLonFlagFactory(value=1, description="Reported")
    species = SpeciesFactory(common_name="Lake Trout", abbrev="LAT")
    strain = StrainFactory(strain_code="SEN", strain_label="Seneca")

    strain_raw = StrainRawFactory(
        species=species,
        strain=strain,
        raw_strain="Sp. Strain",
        description="Special Strain",
    )

    stocking_method = StockingMethodFactory(
        stk_meth="b", description="boat, offshore stocking"
    )

    lifestage = LifeStageFactory(abbrev="y", description="Yearling")
    condition = ConditionFactory(
        condition="0", description="unknown condition at stocking"
    )

    event = StockingEventFactory(
        species=species,
        strain_raw=strain_raw,
        agency=agency,
        jurisdiction=jurisdiction,
        grid_10=grid_10,
        latlong_flag=latlong_flag,
        stocking_method=stocking_method,
        lifestage=lifestage,
        condition=condition,
        stock_id=stock_id,
        year_class=2018,
        agemonth=15,
        year=2019,
        day=15,
        month=4,
        date=datetime(2019, 4, 15),
        site="The Spawning Reef",
        clip_code=None,
        length=None,
        weight=None,
        no_stocked=10000,
        yreq_stocked=11111,
    )

    event.agency_stock_id = None
    event.hatchery = None
    event.save()

    return event


@pytest.fixture(scope="function")
def complete_event(base_event):
    """
    A pytest fixture for a stocking event that will have all of its
    fields and associated tables filled - all of the optional details
    in the template will be present when this event is rendered.

    All of the information included in this fixure should be included
    in the rendered detail page.

    """

    event = base_event

    hatchery = HatcheryFactory(
        hatchery_name="Chatsworth Fish Culture Station", abbrev="CWC"
    )

    agency_stock_id = "omnr_12345"

    # these are many-to-many and need to be added after the event is created:
    ox_mark = PhysChemMarkFactory(
        mark_code="OX", mark_type="chemcial", description="Oxytetracycline"
    )
    adclip = FinClipFactory(abbrev="AD", description="Adipose")
    doclip = FinClipFactory(abbrev="DO", description="Dorsal")

    clip_code = CompositeFinClipFactory(clip_code="ADDO", description="Adipose, Dorsal")

    cwt_tag = FishTagFactory(
        tag_code="CWT", tag_type="CWT", description="Coded Wire Tag"
    )

    cwt = CWTFactory(
        cwt_number=123456, tag_count=10000, tag_type="cwt", manufacturer="nmt"
    )

    event.hatchery = hatchery
    event.fish_tags.add(cwt_tag)
    event.physchem_marks.add(ox_mark)
    event.tag_ret = 90
    event.mark_eff = 85
    event.agency_stock_id = agency_stock_id
    event.weight = 99
    event.length = 123
    event.clip_code = clip_code
    event.fin_clips.set([adclip, doclip])
    event.save()

    return event


# these are the elements for all stocking events
required_elements = [
    ("stock_id", "2019_12345"),
    ("species", "Lake Trout (LAT)"),
    ("strain", "Seneca (SEN)"),
    ("raw strain", '<td id="strain-raw">Special Strain(Sp. Strain)</td>'),
    ("agency ", "Ontario Ministry of Natural Resources and Forestry (OMNRF)"),
    ("lake", '<td class="capitalize">Huron (HU)</td>'),
    ("state/province", '<td class="capitalize">Ontario (ON)</td>'),
    ("site name", "The Spawning Reef"),
    ("10 minute grid", '<td class="capitalize">1234 (HU)</td>'),
    ("latlong flag", "1 - Reported"),
    ("stocking date (if known)", "April 15, 2019"),
    ("stocking method", "boat, offshore stocking (b)"),
    ("lifestage", "Yearling (y)"),
    ("age of stocked fish", '<td class="capitalize">15</td>'),
    ("year class", '<td class="capitalize">2018</td>'),
]


# these are the elements that are displayed if they are available
optional_elements = [
    ("clipcode", '<td id="clip-code">ADDO - Adipose, Dorsal</td>'),
    ("tags", '<td id="tags"><p>Coded Wire Tag (CWT)</p></td>'),
    ("tag_reten", '<td id="tag-reten">90.0</td>'),
    ("physchem_marks", '<td id="physchem-marks"><p>Oxytetracycline (OX)</p></td>'),
    ("mark_eff", '<td id="mark-eff">85.0</td>'),
]

# these are the elements that are displayed if option elements are not available
placeholder_elements = [
    ("agency_stock_id", '<td id="agency-stock-id">Not Reported</td>'),
    ("hatchery", '<td id="hatchery">Not Reported</td>'),
    ("length", '<td id="length">Not Reported</td>'),
    ("weight", '<td id="weight">Not Reported</td>'),
    ("clipcode", '<td id="clip-code">None Reported</td>'),
    ("tags", '<td id="tags">None Reported</td>'),
    ("tag_reten", '<td id="tag-reten">Not Reported</td>'),
    ("physchem_marks", '<td id="physchem-marks">None Reported</td>'),
    ("mark_eff", '<td id="mark-eff">Not Reported</td>'),
    ("validation", '<td id="validation">Not Reported</td>'),
    ("lot-code", '<td id="lot-code">Not Reported</td>'),
    ("additional_notes", ' <div class="summary" id="additional-notes">None</div>'),
]

complete_elements = required_elements + optional_elements


@pytest.mark.parametrize("element,expected", complete_elements)
@pytest.mark.django_db
def test_expected_elements_appears(client, complete_event, element, expected):
    """
    Each of the required elements are always to presented on the the detail page

    """

    url = reverse(
        "stocking:stocking-event-detail", kwargs={"stock_id": complete_event.stock_id}
    )
    response = client.get(url)
    assertContains(response, expected, html=True)


@pytest.mark.parametrize("element,expected", placeholder_elements)
@pytest.mark.django_db
def test_placeholder_elements_appears(client, base_event, element, expected):
    """If the optional elements are not available to for the stocking
    event, they should be reported as 'Not Reported'.

    """

    url = reverse(
        "stocking:stocking-event-detail", kwargs={"stock_id": base_event.stock_id}
    )
    response = client.get(url)
    assertContains(response, expected, html=True)


@pytest.mark.django_db
def test_no_cwt_panel_without_cwts_appears(client, base_event):
    """If the stocking event does not have any cwts, the additional html
    elements should not be incuded in the response.

    """

    url = reverse(
        "stocking:stocking-event-detail", kwargs={"stock_id": base_event.stock_id}
    )
    response = client.get(url)

    not_expected = "<h5>Coded Wire Tags</h5>"

    assertNotContains(response, not_expected, html=True)


@pytest.mark.django_db
def test_edit_event_button_authorized_user(client, base_event, user):
    """If the user is logged in, the edit-event button should appear if
    the user has authority to edit this event. (in this case, our user
    is the glsc super user.)
    """

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True

    url = reverse(
        "stocking:stocking-event-detail", kwargs={"stock_id": base_event.stock_id}
    )
    response = client.get(url)

    edit_url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": base_event.stock_id}
    )
    assertContains(response, edit_url)


@pytest.mark.django_db
def test_no_edit_event_button_anonymous_user(client, base_event):
    """If the user is logged in, the edit-event button should
    appear. (note this will fail once we establish roles only users who
    can edit should be able to see the vent button).

    """
    url = reverse(
        "stocking:stocking-event-detail", kwargs={"stock_id": base_event.stock_id}
    )
    response = client.get(url)

    edit_url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": base_event.stock_id}
    )
    assertNotContains(response, edit_url, html=True)


@pytest.mark.django_db
def test_multiple_physchem_marks_rendered(client, complete_event):
    """If the event has multiple physical-chemical marks associated with
    it, they should be presented in proper case in their own paragraph
    elements, including both the description and the abbreviation.

    """
    # add a second physical/chemical mark to this stocking event
    ca_mark = PhysChemMarkFactory(
        mark_code="CA", mark_type="chemcial", description="Calcein"
    )
    complete_event.physchem_marks.add(ca_mark)
    complete_event.save()

    url = reverse(
        "stocking:stocking-event-detail", kwargs={"stock_id": complete_event.stock_id}
    )
    response = client.get(url)

    expected = ["<p>Calcein (CA)</p>", "<p>Oxytetracycline (OX)</p>"]
    for value in expected:
        assertContains(response, value, html=True)


@pytest.mark.django_db
def test_multiple_fish_tags_rendered(client, complete_event):
    """If the event has multiple types of tags associated with
    it, they should be presented in a semi-colon separated list.

    """
    # add a second tag type to this stocking event:
    floy_tag = FishTagFactory(tag_code="FT", tag_type="floy", description="Floy Tag")
    complete_event.fish_tags.add(floy_tag)
    complete_event.save()

    url = reverse(
        "stocking:stocking-event-detail", kwargs={"stock_id": complete_event.stock_id}
    )
    response = client.get(url)

    expected = ["<p>Coded Wire Tag (CWT)</p>", "<p>Floy Tag (FT)</p>"]
    for value in expected:
        print(response.content)
        assertContains(response, value, html=True)


@pytest.mark.xfail
@pytest.mark.django_db
def test_latlon_flag(client, base_event):
    """The detail page should include some indication of the precision of
    the spatial information - was it report, inferred from a grid number,
    a management unit, or something else?

    """
    assert 0 == 1


@pytest.mark.django_db
def test_cwt_details_rended_if_present(client, base_event):
    """If this stocking event has cwts associated with it, they should be rendered on teh page."""

    elements = [
        "<h5>Coded Wire Tags</h5>",
        "<th>CWT Number</th>",
        "<th>Tag Type</th>",
        "<th>Manufacturer</th>",
        "<th>Event Count</th>",
    ]

    cwt_number = "123456"

    cwt = CWTFactory(cwt_number=cwt_number)
    cwt_series = CWTsequenceFactory(cwt=cwt)

    base_event.cwt_series.add(cwt_series)
    base_event.save()

    url = reverse(
        "stocking:stocking-event-detail", kwargs={"stock_id": base_event.stock_id}
    )
    response = client.get(url)

    assertContains(response, "12-34-56")
    for element in elements:
        assertContains(response, element)


@pytest.mark.django_db
def test_no_cwt_details_rended(client, base_event):
    """If this stocking event does not have any cwts associated with it,
    the elements specific to cwts sohould not be rendered on the page.

    """

    # these are some of the cwt specific elements that should not
    # appear if no cwts are associated with this event.
    elements = [
        "<h5>Coded Wire Tags</h5>",
        "<th>CWT Number</th>",
        "<th>Tag Type</th>",
        "<th>Manufacturer</th>",
        "<th>Event Count</th>",
    ]
    cwt_number = "123456"

    url = reverse(
        "stocking:stocking-event-detail", kwargs={"stock_id": base_event.stock_id}
    )
    response = client.get(url)

    assertNotContains(response, "12-34-56")
    for element in elements:
        assertNotContains(response, element)
