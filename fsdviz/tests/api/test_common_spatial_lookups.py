"""=============================================================
 c:/Users/COTTRILLAD/1work/LakeTrout/Stocking/GLFSD_Datavis/fsdviz/fsdviz/tests/api/test_common_spatial_lookups.py
 Created: 04 Oct 2019 08:54:21


 DESCRIPTION:

  The spatial lookup api endpoints accept a lat-lon coordinate and
  return the attributes of the object that contains that point within
  its geometry.  There are spatial lookup end points for:

  + lakes
  + juristiction (waters within a state/province boundary)
  + management units
  + 10-minute grids

  Each entity type contains two multi polygon fields - geom and
  geom_plus.  The field geom - contains the pure, nominal polygon -
  exactly what people would expect to see on a map.  geom_plus
  contains any adjacent areas in tributaries/or watersheds that would
  capture stocking events that occured in tributaries, outside of the
  shoreline boundaries.

  The tests are parameterized to accept 3 points - one is inside both
  geometries, one inside the plus geometry, but outside the pure
  geometry, while the third is outside of both.


 A. Cottrill
=============================================================

"""
import pytest
from django.contrib.gis.geos import GEOSGeometry
from django.urls import reverse
from rest_framework import status
from ..common_factories import (
    LakeFactory,
    StateProvinceFactory,
    JurisdictionFactory,
    ManagementUnitFactory,
    Grid10Factory,
)


@pytest.fixture()
def polygonA():
    """A polygon somewhere in Lake Huron.
    """

    wkt = (
        "MULTIPOLYGON(((-82.0 44.0,"
        + "-82.5 44.0,"
        + "-82.5 44.5,"
        + "-82.0 44.5,"
        + "-82.0 44.0)))"
    )
    return GEOSGeometry(wkt.replace("\n", ""), srid=4326)


@pytest.fixture()
def polygonB():
    """A polygon somewhere in Lake Superior
    """
    wkt = (
        "MULTIPOLYGON(((-87.0 48.0,"
        + "-87.5 48.0,"
        + "-87.5 48.5,"
        + "-87.0 48.5,"
        + "-87.0 48.0)))"
    )
    return GEOSGeometry(wkt.replace("\n", ""), srid=4326)


@pytest.mark.django_db
def test_get_lake_from_point_pure(client, polygonA, polygonB):
    """If we pass coordinates to our endpoint that fall within the geometry
    of a lake object, we should get a response back that contains the
    details of that lake object.

    """
    # create two lakes with disjoint geometries - the first geom will
    # contain our point:

    # get a point inside our polygon we wil use to select it
    centroid = polygonA.centroid

    assert polygonA.contains(centroid) is True

    huron = dict(abbrev="HU", lake_name="Lake Huron", geom=polygonA)
    LakeFactory(**huron)

    superior = dict(abbrev="SU", lake_name="Lake Superior", geom=polygonA)
    LakeFactory(**superior)

    url = reverse("common_api:api-lookup-lake-from-pt")

    response = client.post(url, {"point": centroid.wkt})
    assert response.status_code == status.HTTP_200_OK

    expected_keys = ["abbrev", "centroid", "extent", "id", "lake_name"]
    for key in expected_keys:
        assert key in response.data.keys()

    # verify that we got thte right object
    assert response.data.get("abbrev") == "HU"
    assert response.data.get("lake_name") == "Lake Huron"


#
# def test_get_lake_from_point_plus():
#    """If we pass coordinates to our with the argument '?plus=True' endpoint that fall within the geometry
#    of a lake object, we should get a response back that contains the
#    details of that lake object.
#
#    """
#    assert 0 == 1
#


@pytest.mark.django_db
def test_get_lake_from_point_400(client):
    """If we pass bad coordinates to our lake lookup endpoint, should
    return a reponse with status 400

    """
    url = reverse("common_api:api-lookup-lake-from-pt")
    response = client.post(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_get_lake_from_point_404(client, polygonA, polygonB):
    """If we pass coordinates to our lake lookup endpoint, that are
    outside of any existing polygon, we return a reponse with status 404

    """
    # get a point outside our polygon
    centroid = polygonB.centroid
    assert polygonA.contains(centroid) is False

    huron = dict(abbrev="HU", lake_name="Lake Huron", geom=polygonA)
    LakeFactory(**huron)

    url = reverse("common_api:api-lookup-lake-from-pt")
    response = client.post(url, {"point": centroid.wkt})
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_jurisdiction_from_point_pure(client, polygonA, polygonB):
    """If we pass coordinates to our endpoint that fall within the geometry
    of a jurisdiction object, we should get a response back that contains the
    details of that jurisdiction object.

    """

    centroid = polygonA.centroid

    assert polygonA.contains(centroid) is True

    huron = dict(abbrev="HU", lake_name="Lake Huron")
    huron_obj = LakeFactory(**huron)

    # province of ontario
    ontario = dict(
        abbrev="ON",
        name="Ontario",
        country="CAN",
        description="The Province of Ontario",
    )
    ontario_obj = StateProvinceFactory(**ontario)

    michigan = dict(
        abbrev="MI", name="Michigan", country="USA", description="The State of Michigan"
    )
    michigan_obj = StateProvinceFactory(**michigan)

    JurisdictionFactory(lake=huron_obj, stateprov=ontario_obj, geom=polygonA)
    JurisdictionFactory(lake=huron_obj, stateprov=michigan_obj, geom=polygonB)

    url = reverse("common_api:api-lookup-jurisdiction-from-pt")

    response = client.post(url, {"point": centroid.wkt})
    assert response.status_code == status.HTTP_200_OK

    expected_keys = [
        "id",
        "lake_id",
        "lake_abbrev",
        "lake_name",
        "stateprov_id",
        "stateprov_abbrev",
        "stateprov_name",
        "jurisdiction_name",
        "centroid",
        "extent",
    ]

    observed_keys = list(response.data.keys())
    observed_keys.sort()
    expected_keys.sort()

    assert expected_keys == observed_keys
    assert response.data.get("stateprov_abbrev") == "ON"


@pytest.mark.django_db
def test_get_jurisdiction_from_point_400(client):
    """If we pass bad coordinates to our jurisdiction lookup endpoint, should
    return a reponse with status 400

    """
    url = reverse("common_api:api-lookup-jurisdiction-from-pt")
    response = client.post(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_get_jurisdiction_from_point_404(client, polygonA, polygonB):
    """If we pass coordinates to our jurisdiction lookup endpoint, that are
    outside of any existing polygon, we return a reponse with status 404

    """
    # get a point outside our polygon
    centroid = polygonB.centroid
    assert polygonA.contains(centroid) is False

    huron = dict(abbrev="HU", lake_name="Lake Huron")
    huron_obj = LakeFactory(**huron)

    # province of ontario
    ontario = dict(
        abbrev="ON",
        name="Ontario",
        country="CAN",
        description="The Province of Ontario",
    )
    ontario_obj = StateProvinceFactory(**ontario)

    JurisdictionFactory(lake=huron_obj, stateprov=ontario_obj, geom=polygonA)

    url = reverse("common_api:api-lookup-jurisdiction-from-pt")
    response = client.post(url, {"point": centroid.wkt})
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_manUnit_from_point_pure_wo_param(client, polygonA, polygonB):
    """If we pass coordinates to our management spatial lookup endpoint
    and do not provide any query parameters, we should get the default
    management area that has default=True.
    """

    # get a point inside our polygon we wil use to select it
    centroid = polygonA.centroid

    assert polygonA.contains(centroid) is True

    huron = LakeFactory(abbrev="HU", lake_name="Lake Huron")

    ManagementUnitFactory(label="OH-1", lake=huron, geom=polygonA)
    ManagementUnitFactory(label="OH-2", lake=huron, geom=polygonB)

    # same geometry as OH-1, different mu type and primary designation:
    ManagementUnitFactory(
        label="QMA-1", lake=huron, geom=polygonA, primary=False, mu_type="qma"
    )

    url = reverse("common_api:api-lookup-management-unit-from-pt")

    response = client.post(url, {"point": centroid.wkt})
    assert response.status_code == status.HTTP_200_OK

    expected_keys = ["id", "slug", "label", "mu_type", "centroid", "extent"]

    for key in expected_keys:
        assert key in response.data.keys()

    # verify that we got thte right object
    assert response.data.get("label") == "OH-1"


@pytest.mark.django_db
def test_get_manUnit_from_point_pure_w_param(client, polygonA, polygonB):
    """If we pass coordinates to our management spatial lookup endpoint
    and with a mu_type parameter, we should get the management unit
    of that type (not necessarily the  default mu_type).

    """

    # get a point inside our polygon we wil use to select it
    centroid = polygonA.centroid
    assert polygonA.contains(centroid) is True

    huron = LakeFactory(abbrev="HU", lake_name="Lake Huron")
    ManagementUnitFactory(label="OH-1", lake=huron, geom=polygonA)
    ManagementUnitFactory(label="OH-2", lake=huron, geom=polygonB)

    # same geometry, different mu type and primary designation:
    ManagementUnitFactory(
        label="QMA-1", lake=huron, geom=polygonA, primary=False, mu_type="qma"
    )

    url = reverse("common_api:api-lookup-management-unit-from-pt")

    response = client.post(url + "?mu_type=qma", {"point": centroid.wkt})
    assert response.status_code == status.HTTP_200_OK

    expected_keys = ["id", "slug", "label", "mu_type", "centroid", "extent"]

    for key in expected_keys:
        assert key in response.data.keys()

    # verify that we got thte right object
    assert response.data.get("label") == "QMA-1"


@pytest.mark.django_db
def test_get_manUnit_from_point_pure_w_all(client, polygonA, polygonB):
    """If we pass coordinates to our management spatial lookup endpoint
    and with parameter all=True, we should get a list of the json objects
    representing all of the management units that contains that point.
    """

    # get a point inside our polygon we wil use to select it
    centroid = polygonA.centroid

    assert polygonA.contains(centroid) is True

    huron = LakeFactory(abbrev="HU", lake_name="Lake Huron")

    ManagementUnitFactory(label="OH-1", lake=huron, geom=polygonA)
    ManagementUnitFactory(label="OH-2", lake=huron, geom=polygonB)

    # same geometry, different mu type and primary designation:
    ManagementUnitFactory(
        label="QMA-1", lake=huron, geom=polygonA, primary=False, mu_type="qma"
    )

    url = reverse("common_api:api-lookup-management-unit-from-pt")

    response = client.post(url + "?all=True", {"point": centroid.wkt})
    assert response.status_code == status.HTTP_200_OK

    assert len(response.data) == 2

    expected = ["QMA-1", "OH-1"]
    observed = [x.get("label") for x in response.data]

    expected.sort()
    observed.sort()

    # verify that we got thte right object
    assert expected == observed


@pytest.mark.django_db
def test_get_management_unit_from_point_400(client):
    """If we pass bad coordinates to our management unit lookup endpoint, should
    return a reponse with status 400

    """
    url = reverse("common_api:api-lookup-management-unit-from-pt")
    response = client.post(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_get_management_unit_from_point_404(client, polygonA, polygonB):
    """If we pass coordinates to our management_unit lookup endpoint, that are
    outside of any existing polygon, we return a reponse with status 404

    """
    # get a point outside our polygon and verify that this is the case
    centroid = polygonB.centroid
    assert polygonA.contains(centroid) is False

    huron = LakeFactory(abbrev="HU", lake_name="Lake Huron")
    ManagementUnitFactory(label="OH-1", lake=huron, geom=polygonA)

    url = reverse("common_api:api-lookup-management-unit-from-pt")
    response = client.post(url, {"point": centroid.wkt})
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_get_grid10_from_point_pure(client, polygonA, polygonB):
    """If we pass coordinates to our grid10 spatial lookup endpoint that
    fall within the geometry of a grid10 object, we should get a
    response back that contains the details of that grid10 object.

    """

    # get a point inside our polygon we wil use to select it
    centroid = polygonA.centroid

    assert polygonA.contains(centroid) is True

    huron = LakeFactory(abbrev="HU", lake_name="Lake Huron")

    Grid10Factory(grid="1234", lake=huron, geom=polygonA)
    Grid10Factory(grid="5678", lake=huron, geom=polygonB)

    url = reverse("common_api:api-lookup-grid10-from-pt")

    response = client.post(url, {"point": centroid.wkt})
    assert response.status_code == status.HTTP_200_OK

    expected_keys = [
        "id",
        "grid",
        "centroid",
        "extent",
        "lake_id",
        "lake_abbrev",
        "lake_name",
    ]

    for key in expected_keys:
        assert key in response.data.keys()

    # verify that we got thte right object
    assert response.data.get("grid") == "1234"
    assert response.data.get("slug") == "hu_1234"
    assert response.data.get("lake_abbrev") == "HU"
    assert response.data.get("lake_name") == "Lake Huron"


@pytest.mark.django_db
def test_get_grid10_from_point_400(client):
    """If we pass bad coordinates to our grid lookup endpoint, should
    return a reponse with status 400

    """
    url = reverse("common_api:api-lookup-grid10-from-pt")
    response = client.post(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_get_grid10_from_point_404(client, polygonA, polygonB):
    """If we pass coordinates to our grid10 lookup endpoint, that are
    outside of any existing polygon, we return a reponse with status 404

    """
    # get a point outside our polygon and verify that this is the case
    centroid = polygonB.centroid
    assert polygonA.contains(centroid) is False

    huron = LakeFactory(abbrev="HU", lake_name="Lake Huron")
    Grid10Factory(grid="1234", lake=huron, geom=polygonA)

    url = reverse("common_api:api-lookup-grid10-from-pt")
    response = client.post(url, {"point": centroid.wkt})
    assert response.status_code == status.HTTP_404_NOT_FOUND
