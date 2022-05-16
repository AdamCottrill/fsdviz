"""The tests in the file ensure that the cwt list page renders
properly, contains the expected elements, and respects url filters.
The tests use the same fixtures and the cwt_filter tests.

The cwt stocking fixture sets up a series of stocking events with
known attributes, which are then assocaited with cwts.  The tests
verify that expected cwt records are returned in the response
associated with each filter.

"""

import pytest

from rest_framework import status
from rest_framework.test import APITestCase

from django.urls import reverse

from ..pytest_fixtures import cwt_parameters as parameters
from ..pytest_fixtures import (
    cwt_stocking_events,
    reused_cwt_parameters,
    reused_cwt_stocking_events,
)


@pytest.mark.django_db
def test_cwt_list_elements(client, cwt_stocking_events):
    """Verify that the api response contains the fields we expect it does."""

    url = reverse("stocking_api:api-get-cwt-stocking-events")

    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK

    payload = response.data["results"]

    assert len(payload) == 6

    first = payload[0]

    observed_fields = list(first.keys())
    expected_fields = [
        "cwt_number",
        "tag_type",
        "seq_lower",
        "seq_upper",
        "manufacturer",
        "tag_reused",
        "multiple_lakes",
        "multiple_species",
        "multiple_strains",
        "multiple_yearclasses",
        "multiple_agencies",
        "stock_id",
        "agency_stock_id",
        "agency_code",
        "lake",
        "state",
        "jurisd",
        "man_unit",
        "grid10",
        "primary_location",
        "secondary_location",
        "latitude",
        "longitude",
        "year",
        "month",
        "day",
        "spc",
        "strain",
        "year_class",
        "mark",
        "clipcode",
        "stage",
        "method",
        "no_stocked",
        "event_tag_numbers",
    ]

    assert set(expected_fields) == set(observed_fields)


@pytest.mark.django_db
@pytest.mark.parametrize("filter, expected, excluded, prefetch", parameters)
def test_cwt_list_filters(
    client, cwt_stocking_events, filter, expected, excluded, prefetch
):
    """Verify that the the cwt sequence filters behave as expected. This
    test is parmeterized to accept a series of four element tuples - the
    filter to be applied, the expected list of cwts numbers, a list of cwt
    numbers that should not be returned, and an optional string specifying
    a prefetch_related to pass to the queryset.
    """

    url = reverse("stocking_api:api-get-cwt-stocking-events")
    response = client.get(url, filter)
    assert response.status_code == status.HTTP_200_OK

    payload = response.data["results"]
    observed_cwts = {x["cwt_number"] for x in payload}

    assert set(expected) == observed_cwts
    for item in excluded:
        assert item not in observed_cwts


@pytest.mark.django_db
@pytest.mark.parametrize("filter, expected, excluded, prefetch", reused_cwt_parameters)
def test_reused_cwt_list_filters(
    client, reused_cwt_stocking_events, filter, expected, excluded, prefetch
):
    """Verify that the the cwt sequence filters behave as expected. This
    test is parmeterized to accept a series of four element tuples - the
    filter to be applied, the excepted list of cwts numbers, a list of cwt
    numbers that should not be returned, and an optional string specifying
    a prefetch_related to pass to the queryset.

    Several of the cwts in the supplied fixture have been
    re-used. These tests verify that filters applied to events with
    re-used tags, returns the correct events (not other events that
    used the same tag number.)

    """

    url = reverse("stocking_api:api-get-cwt-stocking-events")
    response = client.get(url, filter)
    assert response.status_code == status.HTTP_200_OK

    payload = response.data["results"]

    observed = [x["stock_id"] for x in payload]
    observed.sort()
    expected.sort()

    assert expected == observed
    for item in excluded:
        assert item not in observed
