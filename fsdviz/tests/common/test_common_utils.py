import pytest
from django.contrib.gis.geos import Point

from ...common.utils import parse_point, getOverlap, check_ranges


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


args = (
    ([9, 20], [1, 10], 2),
    ([1, 10], [9, 20], 2),
    ([1, 10], [10, 20], 1),
    ([1, 10], [11, 20], 0),
)


@pytest.mark.parametrize("array,rng,expected", args)
def test_get_overlap(array, rng, expected):
    """Verify that our get overlap function works as expected. Used by
    cwt series formset to verify that cwt sequence values are mutually
    exclusive.

    Arguments:
    - `array`:
    - `rng`:
    - `expected`:

    """

    assert getOverlap(array, rng) == expected


# an empty starting dict
# a starting dict, an exsiting key, but no overlap
# a starting dict, a new key, and no overlap
# a starting dict, an exsiting key, and a range that overlaps with the exsting one.

args = (
    ({}, "A", (1, 5), (False, dict(A=[(1, 5)]))),
    (dict(A=[(12, 15)]), "A", (1, 5), (False, dict(A=[(12, 15), (1, 5)]))),
    (dict(A=[(12, 15)]), "B", (1, 5), (False, dict(B=[(1, 5)], A=[(12, 15)]))),
    (dict(A=[(12, 15)]), "A", (1, 14), (True, dict(A=[(12, 15)]))),
)


@pytest.mark.parametrize("range_dict,key,range, expected", args)
def test_check_ranges(range_dict, key, range, expected):
    """Our check ranges function accepts a dictionary, a key value, and a
    range and returns TRUE if the provided range overlaps with one of the
    existing ranges for the same key. This is drectly applicable to
    sequentail tags.  This function is used to validate the cwtformset.

    Arguments:
    - `array`:
    - `rng`:
    - `expected`:

    """

    assert check_ranges(range_dict, key, range) == expected
