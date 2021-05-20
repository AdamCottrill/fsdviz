import pytest
import uuid
from django.contrib.gis.geos import Point, GEOSGeometry

from ...common.utils import is_uuid4, parse_geom, getOverlap, check_ranges, parseFinClip


@pytest.mark.parametrize(
    "wkt",
    [
        "POINT(-82.3 46.0 )",
        "POLYGON ((-80.98 45.03, -81.15 44.90, -81.02 44.42, -80.38 44.45, -80.33 44.85, -80.98 45.03))",
    ],
)
def test_parse_geom_good_geom(wkt):
    """Our parse_geom function accepts an string either as geojson or wkt
    and returns django GEOS geometry object.  Compare hex values to verify
    that the represent the same geometries.

    """

    # wkt = "POLYGON ((-80.98 45.03, -81.15 44.90, -81.02 44.42, -80.38 44.45, -80.33 44.85, -80.98 45.03))"
    geom = GEOSGeometry(wkt)
    assert parse_geom(wkt).hex == geom.hex

    # use our geos object to create the geojson (formatting in a test file is a pain).
    geojson = geom.geojson
    assert parse_geom(geojson).hex == geom.hex


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
def test_parse_geom_pt_bad(bad_point):
    """if our parse_geom function recieves a string that cannot be
    converted to a geometry object, it should return None (but not blowup!)"""
    assert parse_geom(bad_point) is None


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


def test_is_uuid4():
    """our helper function is_uuid4() should return true if the string
    looks like a uuid4 object, but false otherwise

    """

    val = uuid.uuid4()
    assert is_uuid4(str(val)) is True

    val = uuid.uuid4()
    assert is_uuid4(str(val)) is True

    # uuid1 values are similar, but don't match exactly.
    val = uuid.uuid1()
    assert is_uuid4(str(val)) is False

    val = uuid.uuid1()
    assert is_uuid4(str(val)) is False

    assert is_uuid4("FoobarBaz") is False


args = (
    ("", []),
    ("AD", ["AD"]),
    ("ADAN", ["AD", "AN"]),
    ("ADDOLP", ["AD", "DO", "LP"]),
)


@pytest.mark.parametrize("finclip,expected", args)
def test_parseFinClip(finclip, expected):
    """Given a (composite) fin clip string, parse it into is 2-character
    substrings.

    Arguments:
    - `args`:

    """

    assert parseFinClip(finclip) == expected
