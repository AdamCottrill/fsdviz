import pytest
from django.contrib.gis.geos import Point

from ...common.utils import parse_point


@pytest.mark.parametrize(
    "good_point",
    [
        "POINT(-82.3 46.0 )",
        "010100000033333333339354C00000000000004740",
        '{ "type": "Point", "coordinates": [ -82.3, 46.0 ] }',
    ],
)
#
# ]
# )


def test_parse_point_good(good_point):
    """
    """
    expected = Point(-82.3, 46.0)
    assert parse_point(good_point).hex == expected.hex


## some strings the problems - typo, empty, null, geojson polygon (not point)
@pytest.mark.parametrize(
    "bad_point",
    [
        "PONT(-82.304725 46.031121 )",
        "",
        None,
        """{
             "type": "Feature",
             "geometry": {
       "type": "Polygon",
       "coordinates": [
         [
           [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
           [100.0, 1.0], [100.0, 0.0]
         ]
       ]
     }""",
    ],
)
def test_parse_point_bad(bad_point):
    """if our parse_point function recieves a string that cannot be
    converted to a point object, it should return None (but not blowup!)"""
    assert parse_point(bad_point) is None
