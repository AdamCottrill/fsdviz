"""=============================================================
 c:/1work/fsdviz/fsdviz/tests/common/test_PointPolygonCollection.py
 Created: 20 Apr 2021 17:32:56

 DESCRIPTION:

    The PointPolygonCollection class provides a data container for
    polygons associated with each point in a list of points. It is
    used in the xls_formset validation to provide a cleaner api for
    accessing associated attributes.

    It has the following methods that sould be tested:

    + point_polygons.add_points(pts)
    + point_polygons.get_lake(pt)
    + point_polygons.get_stateprov(pt)
    + point_polygons.statdist(pt)
    + point_polygons.get_grid10(pt)

    pts is an itterable  of lat-lon points
    pt is a two-element list or tuple of ddlat and ddlon

    we need to ensure that methods respond appropriately to points
    that do not exist in the internal dictionary.


 A. Cottrill
=============================================================

"""

import pytest
from django.contrib.gis.geos import GEOSGeometry

from fsdviz.common.models import Lake, Jurisdiction, ManagementUnit, Grid10
from ..common_factories import (
    JurisdictionFactory,
    LakeFactory,
    StateProvinceFactory,
    ManagementUnitFactory,
    Grid10Factory,
    StateProvinceFactory,
)

from fsdviz.common.utils import PointPolygonsCollection


@pytest.fixture()
def lake():
    """"""
    wkt = "MULTIPOLYGON(((-81 44, -81 45, -82 45, -82 44, -81 44)))"
    geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)
    _lake = LakeFactory(lake_name="Lake Huron", abbrev="HU", geom=geom)
    return _lake


@pytest.fixture()
def ontario():
    """"""

    ontario = StateProvinceFactory(
        abbrev="ON", name="Ontario", description="The Province of Ontario"
    )
    return ontario


@pytest.fixture()
def jurisdiction(lake, ontario):
    """"""
    wkt = "MULTIPOLYGON(((-81 44, -81 45, -81.5 45, -81.5 44, -81 44)))"
    geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

    jurisdiction = JurisdictionFactory(
        name="Huron Ontario", stateprov=ontario, lake=lake, slug="hu_on", geom=geom
    )

    return jurisdiction


@pytest.fixture()
def northernManUnit(lake, jurisdiction):
    """"""
    wkt = "MULTIPOLYGON(((-81 44.5, -81 45, -81.5 45, -81.5 44.5, -81 44.5)))"
    geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

    northern = ManagementUnitFactory(
        label="OH-N",
        lake=lake,
        jurisdiction=jurisdiction,
        geom=geom,
        mu_type="stat_dist",
    )
    return northern


@pytest.fixture()
def northernGrid10(lake):
    """"""
    wkt = "MULTIPOLYGON(((-81 44.75, -81 45, -81.25 45, -81.25 44.75, -81 44.75)))"

    geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)
    grid = Grid10Factory(grid="6789", lake=lake, geom=geom)
    return grid


@pytest.fixture()
def northernPoint():
    """"""
    # wkt = "POINT(-81.10, 44.85)"
    return [-81.10, 44.85]


@pytest.fixture()
def southernManUnit(lake, jurisdiction):
    """"""
    wkt = "MULTIPOLYGON((( -81 44, -81 44.5, -81.5 44.5, -81.5 44, -81 44)))"

    geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

    southern = ManagementUnitFactory(
        label="OH-S",
        lake=lake,
        jurisdiction=jurisdiction,
        geom=geom,
        mu_type="stat_dist",
    )
    return southern


@pytest.fixture()
def southernGrid10(lake):
    """"""
    wkt = "MULTIPOLYGON(((-81 44, -81 44.25, -81.25 44.25, -81.25 44, -81 44)))"
    geom = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

    grid = Grid10Factory(grid="1234", lake=lake, geom=geom)
    return grid


@pytest.fixture()
def southernPoint():
    """"""
    # wkt = "POINT(-81.10, 44.15)"
    return [-81.10, 44.15]


# def fill_expected(
#     lake,
#     jurisdiction,
#     northernManUnit,
#     southernManUnit,
#     northernGrid10,
#     southernGrid10,
# ):


def get_expected():
    # we need to get some entities out of the datbase directly:
    lake = Lake.objects.get(abbrev="HU")
    jurisdiction = Jurisdiction.objects.get(lake=lake)
    northernManUnit = ManagementUnit.objects.get(label="OH-N")
    southernManUnit = ManagementUnit.objects.get(label="OH-S")
    northernGrid10 = Grid10.objects.get(grid="6789")
    southernGrid10 = Grid10.objects.get(grid="1234")

    # # we need to get some entities out of the datbase directly:
    # lake = Lake.objects.get(abbrev="HU")
    # jurisdiction = Jurisdiction.objects.get(lake=lake)
    # northManUnit = ManagementUnit.objects.get(label="OH-N")
    # southManUnit = ManagementUnit.objects.get(label="OH-S")
    # northGrid = Grid10.objects.get(grid="6789")
    # southGrid = Grid10.objects.get(grid="1234")

    # expected = fill_expected(
    #     lake,
    #     jurisdiction,
    #     northManUnit,
    #     southManUnit,
    #     northGrid,
    #     southGrid,
    # )

    expected = {
        "44.15--81.1": {
            "lake": {
                "id": lake.id,
                "abbrev": "HU",
                "lake_name": "Lake Huron",
                "centroid": "POINT (-81.5 44.5)",
            },
            "jurisdiction": {
                "id": jurisdiction.id,
                "lake_id": lake.id,
                "lake_abbrev": "HU",
                "lake_name": "Lake Huron",
                "stateprov_id": jurisdiction.stateprov.id,
                "stateprov_abbrev": "ON",
                "stateprov_name": "Ontario",
                "jurisdiction_name": "Huron Ontario",
                "centroid": "POINT (-81.25 44.5)",
            },
            "manUnit": {
                "id": southernManUnit.id,
                "slug": "hu_stat_dist_oh-s",
                "label": "OH-S",
                "centroid": "POINT (-81.25 44.25)",
            },
            "grid10": {
                "id": southernGrid10.id,
                "grid": "1234",
                "slug": "hu_1234",
                "centroid": "POINT (-81.125 44.125)",
                "lake_abbrev": "HU",
            },
        },
        "44.85--81.1": {
            "lake": {
                "id": lake.id,
                "abbrev": "HU",
                "lake_name": "Lake Huron",
                "centroid": "POINT (-81.5 44.5)",
            },
            "jurisdiction": {
                "id": jurisdiction.id,
                "lake_id": lake.id,
                "lake_abbrev": "HU",
                "lake_name": "Lake Huron",
                "stateprov_id": jurisdiction.stateprov.id,
                "stateprov_abbrev": "ON",
                "stateprov_name": "Ontario",
                "jurisdiction_name": "Huron Ontario",
                "centroid": "POINT (-81.25 44.5)",
            },
            "manUnit": {
                "id": northernManUnit.id,
                "slug": "hu_stat_dist_oh-n",
                "label": "OH-N",
                "centroid": "POINT (-81.25 44.75)",
            },
            "grid10": {
                "id": northernGrid10.id,
                "grid": "6789",
                "slug": "hu_6789",
                "centroid": "POINT (-81.125 44.875)",
                "lake_abbrev": "HU",
            },
        },
    }

    return expected


keys = ["lake", "jurisdiction", "manUnit", "grid10"]


@pytest.mark.slow
@pytest.mark.django_db()
@pytest.mark.parametrize("key", keys)
def test_add_points_and_get_polygons(
    northernManUnit,
    southernManUnit,
    northernGrid10,
    southernGrid10,
    northernPoint,
    southernPoint,
    key,
):

    """If we provide a point( or points) that fall within the the bounds
    of known polygons, the Point Polygon Collection should return a
    dictionary, keyed by the coordinates of each point.  Each dicttionary
    should contain a second dictionary that has the attribrutes of teh
    associated lake, jurisdiction, stat_district, and 10minute grid.
    These values a can then be used to verify spatial entties provided in
    the xls upload.

    """

    point_polys = PointPolygonsCollection()
    point_polys.add_points([southernPoint, northernPoint])
    observed = point_polys.get_polygons()

    expected = get_expected()

    pt_key = "{}-{}"

    for pt in [northernPoint, southernPoint]:
        pt1 = pt_key.format(pt[1], pt[0])
        assert observed[pt1].get(key) == expected[pt1].get(key)


@pytest.mark.slow
@pytest.mark.django_db()
@pytest.mark.parametrize("key", keys)
def test_get_point_outside_polygons(
    northernManUnit,
    southernManUnit,
    northernGrid10,
    southernGrid10,
    key,
):

    """If we provide a point( or points) that do not fall within the
    bounds of known polygons, the returned object should still be keyed by
    the lat-long but should just return an empty string.
    """

    # a point south and a point north of our ROI
    southernPoint = [-81.10, 43.85]
    northernPoint = [-81.10, 45.15]

    point_polys = PointPolygonsCollection()
    point_polys.add_points([southernPoint, northernPoint])
    observed = point_polys.get_polygons()

    pt_key = "{}-{}"

    for pt in [northernPoint, southernPoint]:
        pt1 = pt_key.format(pt[1], pt[0])
        assert observed[pt1].get(key) == ""
