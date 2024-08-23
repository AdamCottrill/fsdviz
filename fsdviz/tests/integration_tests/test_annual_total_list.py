"""The tests in the file ensure that the annual totals page renders
properly, contains the expected elements, and respects url filters.

The stocking fixture sets up a series of stocking events with known
attributes.  The tests verify that expected totals are rendered when
filter is applied.

"""

import pytest
from django.urls import reverse
from django.utils.text import slugify
from fsdviz.common.templatetags.fsdviz_tags import filter_colour, format_cwt
from pytest_django.asserts import assertContains, assertNotContains, assertTemplateUsed

from ..pytest_fixtures import huron, mdnr, stocking_events, superior, usfws


@pytest.mark.django_db
def test_annual_total_elements(client, stocking_events):
    """Verify that the annual total  page has the basic elements we expect it
    to have.
    """

    url = reverse("stocking:annual-totals-list")

    response = client.get(url)
    assert response.status_code == 200

    assertTemplateUsed("stocking/annual_totals.html")

    elements = [
        'id="annual-totals-table"',
        '<th scope="col">Year</th>',
        '<th scope="col">Lake</th>',
        '<th scope="col">Agency</th>',
        '<th scope="col">State/Prov</th>',
        '<th scope="col">Events</th>',
        '<th scope="col">Species Count</th>',
        '<th scope="col">Fish Stocked</th>',
        '<th scope="col">Yr.Eq Stocked</th>',
    ]

    for element in elements:
        assertContains(response, element)

    for event in stocking_events:

        year = event.year
        agency = event.agency.abbrev
        lake = event.jurisdiction.lake.lake_name
        stateprov = event.jurisdiction.stateprov.name

        row_id = slugify(f"{year}-{lake}-{agency}-{stateprov}")
        assertContains(response, f'id="{row_id}"')


filter_args = [
    (
        {"lake": "HU"},
        ["2010-lake-huron-mdnr-michigan", "2012-lake-huron-usfws-michigan"],
        ["2012-lake-superior-mdnr-michigan", "2018-lake-superior-usfws-wisconsin"],
    ),
    (
        {"agency": "MDNR"},
        [
            "2010-lake-huron-mdnr-michigan",
            "2012-lake-superior-mdnr-michigan",
        ],
        [
            "2012-lake-huron-usfws-michigan",
            "2018-lake-superior-usfws-wisconsin",
        ],
    ),
    (
        {"stateprov": "WI"},
        [
            "2018-lake-superior-usfws-wisconsin",
        ],
        [
            "2010-lake-huron-mdnr-michigan",
            "2012-lake-huron-usfws-michigan",
            "2012-lake-superior-mdnr-michigan",
        ],
    ),

    (
        {"first_year": "2012"},
        [
            "2012-lake-huron-usfws-michigan",
            "2012-lake-superior-mdnr-michigan",
            "2018-lake-superior-usfws-wisconsin",
        ],
        [
            "2010-lake-huron-mdnr-michigan",

        ],
    ),

    (
        {"last_year": "2012"},
        [ "2010-lake-huron-mdnr-michigan",
            "2012-lake-huron-usfws-michigan",
            "2012-lake-superior-mdnr-michigan",
        ],
        ["2018-lake-superior-usfws-wisconsin",

        ],
    ),


]


@pytest.mark.django_db
@pytest.mark.parametrize("filter, expected, excluded", filter_args)
def test_cwt_list_filters(
    client, stocking_events, filter, expected, excluded
):
    """Verify that the the annual total list behaves as expected when
    filters are inlcuded in the url. This test is parmeterized to
    accept a series of three element tuples - the filter to be applied,
    the expected list of slugs, and the list of slugs that
    should not be returned.

    """

    url = reverse("stocking:annual-totals-list")

    response = client.get(url, filter)
    assert response.status_code == 200

    assertTemplateUsed("stocking/annual_totals.html")

    # ensure that the filter buttons are added as well as links to the cwt
    # detail page for each of the expected cwt should be in the
    # response.

    # skip the buttons if the filters are both 'first_year' and 'last_year'
    # the urls are more complicated than we are testing here:

    if not set(filter.keys()) == {"first_year", "last_year"}:

        button_html = (
            '<a href="{3}" class="mini ui icon {2} button">'
            '{0} = {1}<i class="times icon"></i></a>'
        )

        # we need to fill the html with the correct colour, key, and value:
        for key, val in filter.items():
            colour = filter_colour(key)
            html = button_html.format(key, val, colour, url)
            assertContains(response, html, html=True)

    id_string = 'id="{}"'

    # verify that the correct stock ID numbers are returned - can't
    # use cwt because they are confounded if cwts are re-used.
    for value in expected:
        assertContains(response, id_string.format(value))

    for value in excluded:
        assertNotContains(response, id_string.format(value))
