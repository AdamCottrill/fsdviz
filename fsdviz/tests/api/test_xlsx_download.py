"""=============================================================
 c:/1work/fsdviz/fsdviz/tests/api/test_xlsx_download.py
 Created: 02 Dec 2020 17:12:01

 DESCRIPTION:

  The tests in this file verify that the Excel download endpoints for
  stocking events returned the expected results.

  Essentially, the endpoints return a spreadsheet that closely resembles
  the data sumbission template or a json response with the same fields
  that will be used to populate pre-existing spreadsheets for stocking
  coordinators.

 A. Cottrill
=============================================================

"""


import pytest

from django.urls import reverse
from rest_framework import status
from ..pytest_fixtures import usfws, mdnr, superior, huron, stocking_events

# here are the fields we expect to see in our downloaded spreadsheets or api
# resposnes used to poplulate spreadsheets:
FIELD_NAMES = [
    "glfsd_stock_id",
    "agency_stock_id",
    "agency_code",
    "_lake",
    "state_prov",
    "manUnit",
    "grid_10min",
    "location_primary",
    "location_secondary",
    "latitude",
    "longitude",
    "year",
    "month",
    "day",
    "stock_method",
    "species_code",
    "_strain",
    "yearclass",
    "life_stage",
    "age_months",
    "_clip",
    "clip_efficiency",
    "phys_chem_mark",
    "tag_type",
    "cwt_number",
    "tag_retention",
    "mean_length_mm",
    "total_weight_kg",
    "stocking_mortality",
    "lot_code",
    "hatchery_abbrev",
    "number_stocked",
    "notes",
]


@pytest.mark.django_db
def test_xlsx_download_events_xlsx(client, stocking_events):
    """Verify that the xlsx endpoint returns an excel spreadsheet with the
    appropraite keys.

    """

    url = reverse("api:api-stocking-event-list-xlsx")

    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.accepted_media_type == "application/xlsx"
    assert len(response.data) == 4
    expected_fields = set(FIELD_NAMES)
    observed_fields = set(response.data[0].keys())

    assert expected_fields == observed_fields


def test_xlsx_download_events_xlsx_event_filters(client, stocking_events):
    """Verify that the xlsx endpoint returns an excel spreadsheet with the
    appropraite keys and subset of the records specified in the url
    parameters.  This endpoint uses the same StockingEventFilter as
    other endpoints. The filter class has been thoughly tested
    elsewhere. this test just verifies that it is hooked up properly.

    """

    url = reverse("api:api-stocking-event-list-xlsx")

    response = client.get(url, {"lake": "SU"})
    assert response.status_code == status.HTTP_200_OK
    assert response.accepted_media_type == "application/xlsx"
    assert len(response.data) == 2
    expected_fields = set(FIELD_NAMES)
    observed_fields = set(response.data[0].keys())

    assert expected_fields == observed_fields

    # we filtered for one lake, so make sure that our response includes
    # events from just that lake:
    lakes = set([x["_lake"] for x in response.data])
    assert lakes == set(
        [
            "SU",
        ]
    )


def test_xlsx_download_events_json(client, stocking_events):
    """Verifies that the download stocking events endpoint returns the
    expected json when json format is speficied.

    """

    url = reverse("api:api-stocking-event-list-xlsx")

    response = client.get(url, {"format": "json"})
    assert response.status_code == status.HTTP_200_OK
    assert response.accepted_media_type == "application/json"
    assert len(response.data) == 4
    expected_fields = set(FIELD_NAMES)
    observed_fields = set(response.data[0].keys())

    assert expected_fields == observed_fields


def test_xlsx_download_events_json_event_filters(client, stocking_events):
    """Verifies that the download stocking events endpoint returns the
    expected json when json format is speficied. This endpoint uses
    the same StockingEventFilter as other endpoints. The filter class
    has been thoughly tested elsewhere. this test just verifies that
    it is hooked up properly.

    """

    url = reverse("api:api-stocking-event-list-xlsx")

    response = client.get(url, {"format": "json", "lake": "SU"})
    assert response.status_code == status.HTTP_200_OK
    assert response.accepted_media_type == "application/json"
    assert len(response.data) == 2
    expected_fields = set(FIELD_NAMES)
    observed_fields = set(response.data[0].keys())

    assert expected_fields == observed_fields

    # we filtered for one lake, so make sure that our response includes
    # events from just that lake:
    lakes = set([x["_lake"] for x in response.data])
    assert lakes == set(
        [
            "SU",
        ]
    )
