"""=============================================================
~/fsdviz/tests/api/test_common_spatial_lookups_roi.py
 Created: 27 Nov 2020 10:31:18

 DESCRIPTION:

thios test file verifies that the spatial attribute endpoint accepts a
roi as either geojson or wkt and returns the a json response with
attributes of the lakes, jursidictions, and management units that
overlap the region of interest.

This verifies that a valid request procudes a good response and that
the response has the expected attributes, that bad requests are
handled appropriately.

 A. Cottrill
=============================================================

"""

import pytest

from django.contrib.gis.geos import GEOSGeometry

from django.urls import reverse
from rest_framework import status
from ...common.models import Lake, Jurisdiction, ManagementUnit
from ..common_factories import (
    LakeFactory,
    StateProvinceFactory,
    JurisdictionFactory,
    ManagementUnitFactory,
)


@pytest.fixture()
def overlapping_roi():
    """A region of interest that overlaps our three geometries"""

    wkt = (
        "POLYGON((-82.0 43.9,"
        + "-82.1 43.9,"
        + "-82.1 44.1,"
        + "-82.0 44.1,"
        + "-82.0 43.9))"
    )
    return GEOSGeometry(wkt.replace("\n", ""), srid=4326)


@pytest.fixture()
def large_roi():
    """A region of interest that completely contains our three geometries"""

    wkt = (
        "POLYGON((-82.0 44.0,"
        + "-82.6 44.0,"
        + "-82.6 44.6,"
        + "-82.0 44.6,"
        + "-82.0 44.0))"
    )
    return GEOSGeometry(wkt.replace("\n", ""), srid=4326)


@pytest.fixture()
def tiny_roi():
    """A region of interest that is within (but smaller than) our
    managementunits (an by defintion the jurisdiciton and lake).

    """

    wkt = (
        "POLYGON((-82.01 44.1,"
        + "-82.05 44.1,"
        + "-82.05 44.05,"
        + "-82.01 44.05,"
        + "-82.01 44.1))"
    )
    return GEOSGeometry(wkt.replace("\n", ""), srid=4326)


@pytest.fixture()
def disjoint_roi():
    """A region of interest that completely contains our three geometries"""

    wkt = (
        "POLYGON((-81.0 43.0,"
        + "-81.5 43.0,"
        + "-81.5 43.5,"
        + "-81.0 43.5,"
        + "-81.0 43.0))"
    )
    return GEOSGeometry(wkt.replace("\n", ""), srid=4326)


@pytest.fixture()
def simple_setup():
    """create three spatial elements - a lake, a jurisdiction within that
    lake and a managementUnits within that jurisdiction.  Additionally

    """

    wkt = (
        "MULTIPOLYGON(((-82.0 44.0,"
        + "-82.5 44.0,"
        + "-82.5 44.5,"
        + "-82.0 44.5,"
        + "-82.0 44.0)))"
    )
    lake_geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

    # create a lake, jurisdiciton, management_unit and a grid (they all
    # share the same polygon, but that doesn't matter here)
    huron = dict(abbrev="HU", lake_name="Lake Huron", geom=lake_geom)
    huron_obj = LakeFactory(**huron)

    # province of ontario
    ontario = dict(
        abbrev="ON",
        name="Ontario",
        country="CAN",
        description="The Province of Ontario",
    )
    ontario_obj = StateProvinceFactory(**ontario)

    # inside of and smaller than lake:
    wkt = (
        "MULTIPOLYGON(((-82.0 44.0,"
        + "-82.3 44.0,"
        + "-82.3 44.3,"
        + "-82.0 44.3,"
        + "-82.0 44.0)))"
    )
    jurisdiction_geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

    JurisdictionFactory(
        lake=huron_obj,
        stateprov=ontario_obj,
        name="Huron-Ontario",
        geom=jurisdiction_geom,
    )

    # inside of and smaller than jurisdiciton:
    wkt = (
        "MULTIPOLYGON(((-82.0 44.0,"
        + "-82.2 44.0,"
        + "-82.2 44.2,"
        + "-82.0 44.2,"
        + "-82.0 44.0)))"
    )
    mu_geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

    ManagementUnitFactory(
        label="OH-3", lake=huron_obj, geom=mu_geom, mu_type="stat_dist"
    )


@pytest.mark.django_db
def test_spatial_attr_roi_tiny_roi(client, simple_setup, tiny_roi):
    """If we submit a region of intest that is small and completly within
    our smallest geometry, we will still get back the attributes of the
    containing management units, jurisdiciton and lake.

    """

    url = reverse("common_api:api-lookup-roi-attrs")

    response = client.post(url, {"roi": tiny_roi.wkt})
    assert response.status_code == status.HTTP_200_OK

    expected_keys = ["lakes", "jurisdictions", "manUnits"]
    for key in expected_keys:
        assert key in response.data.keys()
        assert len(response.data[key]) == 1


@pytest.mark.django_db
def test_spatial_attr_roi_disjoint_roi(client, simple_setup, disjoint_roi):
    """If we submit a region of intest that is disjoint from any of our
    geometries, our response will be a object with three empty arrays.

    """

    url = reverse("common_api:api-lookup-roi-attrs")

    response = client.post(url, {"roi": disjoint_roi.wkt})
    assert response.status_code == status.HTTP_200_OK

    expected_keys = ["lakes", "jurisdictions", "manUnits"]
    for key in expected_keys:
        assert key in response.data.keys()
        assert len(response.data[key]) == 0


@pytest.mark.django_db
def test_spatial_attr_roi_overlaping_roi(client, simple_setup, overlapping_roi):
    """This test verifies that the spatial roi endpoint returns geometries
    that are only partially contained (ie. overlapping) within the
    region of interest.

    """

    url = reverse("common_api:api-lookup-roi-attrs")

    response = client.post(url, {"roi": overlapping_roi.wkt})
    assert response.status_code == status.HTTP_200_OK

    expected_keys = ["lakes", "jurisdictions", "manUnits"]
    for key in expected_keys:
        assert key in response.data.keys()
        assert len(response.data[key]) == 1


@pytest.mark.django_db
def test_spatial_attr_roi_large_roi(client, simple_setup, large_roi):
    """This test verifies that the spatial roi endpoint returns geometries
    that are completely contained within the region of interest.

    This test verifies that we have specifed 'intersects' rather than
    'overlaps' (which no include geometries that are completely
    contained within the other.)

    """
    url = reverse("common_api:api-lookup-roi-attrs")

    response = client.post(url, {"roi": large_roi.wkt})
    assert response.status_code == status.HTTP_200_OK

    expected_keys = ["lakes", "jurisdictions", "manUnits"]
    for key in expected_keys:
        assert key in response.data.keys()
        assert len(response.data[key]) == 1


@pytest.mark.django_db
def test_spatial_attr_roi_elements(client, simple_setup, overlapping_roi):
    """if the pass roi to our spatial attr roi endpoint, it should return
    json wiht three attributes. lakes, jursidictions, and manUnits

    those elements should contain the attributes of the lakes,
    jursidictions, and manUnits that overlap (or are contained in) the
    roi, but not any elements that do not touch the roi.

    The lake object should contain an array, each element of
    that array should have these properties:
    + id
    + abbrev
    + lake_name

    The jursidictions object should contain an array, each element of
    that array should have these properties:
    + id
    + lake_id
    + stateprov_id
    + jurisd
    + jurisdiction_name
    + lake_abbrev
    + lake_name
    + stateprov_abbrev
    + stateprov_name

    The manUnits object should contain an array, each element of that
    array should have these properies:
    + slug
    + mu_type
    + primary


    """
    url = reverse("common_api:api-lookup-roi-attrs")

    response = client.post(url, {"roi": overlapping_roi.wkt})
    assert response.status_code == status.HTTP_200_OK

    lake = Lake.objects.first()
    expected = [{"id": lake.id, "abbrev": lake.abbrev, "lake_name": lake.lake_name}]
    assert response.data["lakes"] == expected

    jurisdiction = Jurisdiction.objects.select_related("lake", "stateprov").first()
    expected = [
        {
            "id": jurisdiction.id,
            "lake_id": jurisdiction.lake.id,
            "stateprov_id": jurisdiction.stateprov.id,
            "jurisd": jurisdiction.slug,
            "jurisdiction_name": jurisdiction.name,
            "lake_abbrev": jurisdiction.lake.abbrev,
            "lake_name": jurisdiction.lake.lake_name,
            "stateprov_abbrev": jurisdiction.stateprov.abbrev,
            "stateprov_name": jurisdiction.stateprov.name,
        }
    ]

    assert response.data["jurisdictions"] == expected

    manUnit = ManagementUnit.objects.first()
    expected = [
        {
            "slug": manUnit.slug,
            "primary": manUnit.primary,
            "mu_type": manUnit.mu_type,
        }
    ]
    assert response.data["manUnits"] == expected


def test_spatial_attr_bad_roi(client):
    """If we pass a malformed roi string, our endpoint should respond with
    a 400 bad request without blowing up."""

    url = reverse("common_api:api-lookup-roi-attrs")

    response = client.post(url, {"roi": "Not-GeoJSON"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_spatial_attr_multiple_manUnits(client, simple_setup, large_roi):
    """The spatial roi attr should return multiple objects in each list if
    their geoms overlap the supplied geometry."""

    lake = Lake.objects.first()

    # create a couple of other management units next to the first

    wkt = (
        "MULTIPOLYGON(((-82.2 44.0,"
        + "-82.3 44.0,"
        + "-82.3 44.2,"
        + "-82.2 44.2,"
        + "-82.2 44.0)))"
    )
    mu_geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

    ManagementUnitFactory(label="OH-2", lake=lake, geom=mu_geom, mu_type="stat_dist")

    wkt = (
        "MULTIPOLYGON(((-82.3 44.0,"
        + "-82.5 44.0,"
        + "-82.5 44.2,"
        + "-82.3 44.2,"
        + "-82.3 44.0)))"
    )
    mu_geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

    ManagementUnitFactory(label="OH-1", lake=lake, geom=mu_geom, mu_type="stat_dist")

    url = reverse("common_api:api-lookup-roi-attrs")

    response = client.post(url, {"roi": large_roi.wkt})
    assert response.status_code == status.HTTP_200_OK

    data = response.data["manUnits"]
    assert len(data) == 3
    observed = [x["slug"] for x in data]
    tmp = ManagementUnit.objects.all().values_list("slug")
    expected = [x[0] for x in tmp]
    assert set(observed) == set(expected)
