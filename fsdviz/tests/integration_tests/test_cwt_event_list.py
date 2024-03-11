"""The tests in the file ensure that the cwt list page renders
properly, contains the expected elements, and respects url filters.
The tests use the same fixtures and the cwt_filter tests.

The cwt stocking fixture sets up a series of stocking events with
known attributes, which are then assocaited with cwts.  The tests
verify that expected cwt records are returned in the response
associated with each filter.

"""

import pytest
from pytest_django.asserts import assertContains, assertNotContains, assertTemplateUsed

from django.urls import reverse

from ..pytest_fixtures import cwt_parameters as parameters
from ..pytest_fixtures import (
    cwt_stocking_events,
    reused_cwt_parameters,
    reused_cwt_stocking_events,
)

from fsdviz.common.templatetags.fsdviz_tags import format_cwt, filter_colour


@pytest.mark.usefixtures("cwt_stocking_events")
class TestCWTListView:
    """"""

    @pytest.mark.django_db
    def test_cwt_list_elements(self, client):
        """Verify that the cwt list page has the basic elements we expect it
        to have.

        """

        url = reverse("stocking:cwt-list")

        response = client.get(url)
        assert response.status_code == 200

        assertTemplateUsed("stocking/cwt_list.html")

        elements = [
            'id="cwt-list"',
            'id="cwt-menu-search"',
            '<th scope="col">CWT</th>',
            '<th scope="col">Tag Type</th>',
            '<th scope="col">Agency</th>',
            '<th scope="col">Lake</th>',
            '<th scope="col">State/Prov.</th>',
            '<th scope="col">Year</th>',
            '<th scope="col">Species</th>',
            '<th scope="col">Strain</th>',
            '<th scope="col">Year Class</th>',
            '<th scope="col">Life Stage</th>',
            '<th scope="col">Stocking Method</th>',
            '<th scope="col">Clip</th>',
            '<th scope="col">Mark</th>',
        ]

        for element in elements:
            assertContains(response, element)

    @pytest.mark.django_db
    @pytest.mark.parametrize("filter, expected, excluded, prefetch", parameters)
    def test_cwt_list_filters(self, client, filter, expected, excluded, prefetch):
        """Verify that the the cwt sequence filters behave as expected. This
        test is parmeterized to accept a series of four element tuples - the
        filter to be applied, the excepted list of cwts numbers, a list of cwt
        numbers that should not be returned, and an optional string specifying
        a prefetch_related to pass to the queryset.

        """

        url = reverse("stocking:cwt-list")

        response = client.get(url, filter)
        assert response.status_code == 200

        # ensure that the filter buttons are added as well as links to the cwt
        # detail page for each of the expected cwt should be in the
        # response.

        # skip the buttons if the filters are both 'first_year' and 'last_year'
        # the urls are more complicated than we are testing here:

        if not set(filter.keys()) == {"first_year", "last_year"}:

            button_html = (
                '<a href="/stocking/cwts/" class="mini ui icon {2} button">'
                '{0} = {1}<i class="times icon"></i></a>'
            )

            # we need to fill the html with the correct colour, key, and value:
            for key, val in filter.items():
                colour = filter_colour(key)
                html = button_html.format(key, val, colour)
                assertContains(response, html, html=True)

        html = '<td> <a href="{0}">{1}</a></td>'

        for value in expected:
            url = reverse("stocking:cwt-detail", kwargs={"cwt_number": value})
            assertContains(response, html.format(url, format_cwt(value)), html=True)

        for value in excluded:
            url = reverse("stocking:cwt-detail", kwargs={"cwt_number": value})
            assertNotContains(response, html.format(url, format_cwt(value)), html=True)


@pytest.mark.django_db
@pytest.mark.parametrize("filter, expected, excluded, prefetch", reused_cwt_parameters)
def test_cwt_list_filters(
    client, reused_cwt_stocking_events, filter, expected, excluded, prefetch
):
    """Verify that the the cwt sequence filters behave as expected. This
    test is parmeterized to accept a series of four element tuples - the
    filter to be applied, the excepted list of cwts numbers, a list of cwt
    numbers that should not be returned, and an optional string specifying
    a prefetch_related to pass to the queryset.

    Several of the cwts in the supplied fixture have been
    re-used. These tests verify that filters applied to events with
    re-used tags, returns the correct events using the stock_id and
    (not other events that used the same cwt tag number but do not
    meet the filtered criteria).

    """

    url = reverse("stocking:cwt-list")

    response = client.get(url, filter)
    assert response.status_code == 200

    # ensure that the filter buttons are added as well as links to the cwt
    # detail page for each of the expected cwt should be in the
    # response.

    # skip the buttons if the filters are both 'first_year' and 'last_year'
    # the urls are more complicated than we are testing here:

    if not set(filter.keys()) == {"first_year", "last_year"}:

        button_html = (
            '<a href="/stocking/cwts/" class="mini ui icon {2} button">'
            '{0} = {1}<i class="times icon"></i></a>'
        )

        # we need to fill the html with the correct colour, key, and value:
        for key, val in filter.items():
            colour = filter_colour(key)
            html = button_html.format(key, val, colour)
            assertContains(response, html, html=True)

    html = '<tr id="{}-{}">'

    # verify that the correct stock ID numbers are returned - can't
    # use cwt because they are confounded if cwts are re-used.
    for value in expected:
        assertContains(response, html.format(*value))

    for value in excluded:
        assertNotContains(response, html.format(*value))
