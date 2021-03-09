"""=============================================================
 c:/1work/fsdviz/fsdviz/tests/api/test_cwt_api_xlsx.py
 Created: 08 Mar 2021 11:35:22

 DESCRIPTION:

  The tests in this file verify that the Excel download endpoints for
  cwt events returned the expected results.

  Essentially, the endpoints return as spreadsheet with basic stocking
  event information and cwt attributes.

 A. Cottrill
=============================================================

"""


import pytest

from django.urls import reverse
from rest_framework import status
from ..pytest_fixtures import usfws, mdnr, superior, huron, cwt_stocking_events

# here are the fields we expect to see in our downloaded spreadsheets or api
# resposnes used to poplulate spreadsheets:
FIELD_NAMES = [
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
]


@pytest.mark.django_db
def test_xlsx_download_events_xlsx(client, cwt_stocking_events):
    """Verify that the xlsx endpoint returns an excel spreadsheet with the
    appropraite keys.

    """

    url = reverse("api:api-cwt-event-list-xlsx")

    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.accepted_media_type == "application/xlsx"
    assert len(response.data) == 6
    expected_fields = set(FIELD_NAMES)
    observed_fields = set(response.data[0].keys())

    assert expected_fields == observed_fields


def test_xlsx_download_events_xlsx_event_filters(client, cwt_stocking_events):
    """Verify that the xlsx endpoint returns an excel spreadsheet with the
    appropraite keys and subset of the records specified in the url
    parameters.  This endpoint uses the same StockingEventFilter as
    other endpoints. The filter class has been thoughly tested
    elsewhere. this test just verifies that it is hooked up properly.

    """

    url = reverse("api:api-cwt-event-list-xlsx")

    response = client.get(url, {"lake": "SU"})
    assert response.status_code == status.HTTP_200_OK
    assert response.accepted_media_type == "application/xlsx"
    assert len(response.data) == 2
    expected_fields = set(FIELD_NAMES)
    observed_fields = set(response.data[0].keys())

    assert expected_fields == observed_fields

    # we filtered for one lake, so make sure that our response includes
    # events from just that lake:
    lakes = set([x["lake"] for x in response.data])
    assert lakes == set(
        [
            "SU",
        ]
    )


def test_xlsx_download_events_json(client, cwt_stocking_events):
    """Verifies that the download stocking events endpoint returns the
    expected json when json format is speficied.

    """

    url = reverse("api:api-cwt-event-list-xlsx")

    response = client.get(url, {"format": "json"})
    assert response.status_code == status.HTTP_200_OK
    assert response.accepted_media_type == "application/json"
    assert len(response.data) == 6
    expected_fields = set(FIELD_NAMES)
    observed_fields = set(response.data[0].keys())

    assert expected_fields == observed_fields


def test_xlsx_download_events_json_event_filters(client, cwt_stocking_events):
    """Verifies that the download stocking events endpoint returns the
    expected json when json format is speficied. This endpoint uses
    the same StockingEventFilter as other endpoints. The filter class
    has been thoughly tested elsewhere. this test just verifies that
    it is hooked up properly.

    """

    url = reverse("api:api-cwt-event-list-xlsx")

    response = client.get(url, {"format": "json", "lake": "SU"})
    assert response.status_code == status.HTTP_200_OK
    assert response.accepted_media_type == "application/json"
    assert len(response.data) == 2
    expected_fields = set(FIELD_NAMES)
    observed_fields = set(response.data[0].keys())

    assert expected_fields == observed_fields

    # we filtered for one lake, so make sure that our response includes
    # events from just that lake:
    lakes = set([x["lake"] for x in response.data])
    assert lakes == set(
        [
            "SU",
        ]
    )


def test_xlsx_download_events_xlsx_event_cwt_numbers(client, cwt_stocking_events):
    """Verify that the xlsx endpoint returns an excel spreadsheet with the
    appropraite keys and subset of the records specified in the url
    parameters - specific cwts.  This endpoint uses the same
    StockingEventFilter as other endpoints.

    """

    url = reverse("api:api-cwt-event-list-xlsx")

    response = client.get(url, {"cwt_number": "111111,222222"})
    assert response.status_code == status.HTTP_200_OK
    assert response.accepted_media_type == "application/xlsx"
    assert len(response.data) == 2
    expected_fields = set(FIELD_NAMES)
    observed_fields = set(response.data[0].keys())

    assert expected_fields == observed_fields

    # we filtered for one lake, so make sure that our response includes
    # events from just that lake:
    cwts = set([x["cwt_number"] for x in response.data])
    assert cwts == set(["111111", "222222"])
