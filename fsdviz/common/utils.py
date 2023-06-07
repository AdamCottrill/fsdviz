"""
=============================================================
~/fsdviz/fsdviz/common/utils.py
 Created: 06 Sep 2019 11:38:22

 DESCRIPTION:

  Some utility functions that are used in the fsdviz application.

 A. Cottrill
=============================================================
"""
import re
import uuid

from django.contrib.gis.gdal.error import GDALException
from django.contrib.gis.geos import GEOSGeometry, Point, Polygon
from django.contrib.gis.geos.error import GEOSException
from django.db.models import Q


from django_filters import BaseInFilter, CharFilter, NumberFilter

from .models import Grid10, Jurisdiction, Lake, ManagementUnit


class ValueInFilter(BaseInFilter, CharFilter):
    pass


class NumberInFilter(BaseInFilter, NumberFilter):
    pass


class NumberInOrNullFilter(NumberInFilter):
    """a filter for an array of integer numbers - 99 and 9999 are special
    placeholders for missing values."""

    def filter(self, qs, value):
        if value is None:
            return super(NumberInFilter, self).filter(qs, value)
        if 99 not in value:
            return super(NumberInFilter, self).filter(qs, value)

        value.remove(99)

        q1 = Q(**{"%s__%s" % (self.field_name, "in"): value})
        q2 = Q(**{"%s__%s" % (self.field_name, "isnull"): True})
        return qs.filter(q1 | q2)


def int_or_none(val, default=None):
    """Return the val as an integer or None if it cannot be converted.

    Arguments:
    - `x`:
    """
    if val is None:
        if default is not None:
            return default
        else:
            return None
    elif val == "":
        if default is not None:
            return default
        else:
            return None
    else:
        return int(val)


def is_uuid4(x):
    """A little helper function - does the passed in string match a uuid4
    pattern?  Return true if it does match, false otherwise.  Used to
    replace random stock_id with the year and ID number.

    - regex from: https://stackoverflow.com/questions/11384589

    Arguments:
    - `x`: a string that may or may not be a uuid4 value.

    """

    regex = re.compile(
        r"[0-9a-f]{8}\-[0-9a-f]{4}\-4[0-9a-f]{3}\-[89ab][0-9a-f]{3}\-[0-9a-f]{12}"
    )

    return bool(regex.match(x))


def unique_string():
    """Return the string representation of a uuid4 object. It is almost
    certainly going to be unique. Used to create unique temporary
    stock_id value for StockingEvent objects that can be replaced with
    the creation year and pk after the event is created.

    """

    return str(uuid.uuid4())


def parse_geom(data):
    """A helper function used by the spatial lookup api views to convert
    the reqest data to a GEOSGeometry Point or Polygon object.  If it cannot be
    coerced to a Point or Polygon object return None.

    TODOs:

    + consider including a meaningful error message if it cannot be
    converted to geometry object, or is not a Point.


    """

    if data is None:
        return None

    try:
        geom = GEOSGeometry(data, srid=4326)
    except (ValueError, GEOSException, GDALException):
        # the data could not be converted to a valid geometry object
        return None

    if isinstance(geom, Point) or isinstance(geom, Polygon):
        return geom
    else:
        # the data was not a valid Point in either geojson or wkt
        return None


def get_polygons(pt):
    """accepts an GEOSGeometry point object and return a dictionary containing the
    lake, jurisdiction, management_unit, and grid10 objects that
    contain the point.  Used to validate the spatial widgets in the
    stocking event and stocking upload forms.  Given a lat-lon, return
    a dictionary with the following elements:

    + lake - with id, lake name, lake abbrev
    + juristiction - with id, stateprov name, stateprov abbrev
    + manUnit - id, label
    + grid10 - id, label, lake abbrev.

    post data should contain a json string of the form:

    Arguments:
    - `pt`: a  GEOSGeometry Point object

    """

    polygons = dict()

    lake = Lake.objects.filter(geom__contains=pt).first()
    if lake:
        polygons["lake"] = dict(
            id=lake.id,
            abbrev=lake.abbrev,
            lake_name=lake.lake_name,
            centroid=lake.geom.centroid.wkt,
        )
    else:
        polygons["lake"] = ""

    jurisdiction = (
        Jurisdiction.objects.select_related("lake", "stateprov")
        .filter(geom__contains=pt)
        .first()
    )

    if jurisdiction:
        polygons["jurisdiction"] = dict(
            id=jurisdiction.id,
            # lake attributes:
            lake_id=jurisdiction.lake.id,
            lake_abbrev=jurisdiction.lake.abbrev,
            lake_name=jurisdiction.lake.lake_name,
            # state prov. attributes:
            stateprov_id=jurisdiction.stateprov.id,
            stateprov_abbrev=jurisdiction.stateprov.abbrev,
            stateprov_name=jurisdiction.stateprov.name,
            # jurisdiction attributes
            jurisdiction_name=jurisdiction.name,
            centroid=jurisdiction.geom.centroid.wkt,
        )
    else:
        polygons["jurisdiction"] = ""

    manUnit = (
        ManagementUnit.objects.filter(geom__contains=pt)
        .filter(mu_type="stat_dist")
        .first()
    )
    if manUnit:
        polygons["manUnit"] = dict(
            id=manUnit.id,
            slug=manUnit.slug,
            label=manUnit.label,
            centroid=manUnit.geom.centroid.wkt,
        )
    else:
        polygons["manUnit"] = ""

    grid10 = Grid10.objects.select_related("lake").filter(geom__contains=pt).first()

    if grid10:
        polygons["grid10"] = dict(
            id=grid10.id,
            grid=grid10.grid,
            slug=grid10.slug,
            centroid=grid10.geom.centroid.wkt,
            lake_abbrev=grid10.lake.abbrev,
        )
    else:
        polygons["grid10"] = ""

    return polygons


class PointPolygonsCollection(object):
    """A data container for polygons associated with each point in a list
    of points. Used in the xls_formset validation and provide as
    cleaner api for accessing associated attributes:

        pts = {(x["longitude"], x["latitude"]) for x in xls_events}
        point_polygons = PointPolygonsCollection()

        point_polygons.add_points(pts)
        point_polygons.get_lake(pt)
        point_polygons.get_stateprov(pt)
        point_polygons.statdist(pt)
        point_polygons.get_grid10(pt)

    """

    def __init__(
        self,
    ):
        """"""
        self.point_polygons = {}

    def add_points(self, points):
        """

        Arguments:
        - `points`: iterable of ddlat-ddlon pairs
        """

        for xy in points:
            pt = Point(xy[0], xy[1], srid=4326)
            key = "{}-{}".format(xy[1], xy[0])
            self.point_polygons[key] = get_polygons(pt)

    def get_polygons(self):
        """Return all of the polygons associated with all of the points in the
        current collection.  Returns a dictionary keyed by the lat-lon of each
        point.

        Arguments:
        - `pt`:

        """
        return self.point_polygons

    def get_lake(self, pt):
        """Return the attributes of the lake assocated with the provided point.

        Arguments:
        - `pt`:
        """
        key = "{}-{}".format(pt[0], pt[1])
        return self.point_polygons.get(key, {}).get("lake", "")

    def get_jurisdiction(self, pt):
        """Return the attributes of the jurisdiction assocated with the provided point.

        Arguments:
        - `pt`:
        """
        key = "{}-{}".format(pt[0], pt[1])
        return self.point_polygons.get(key, {}).get("jurisdiction")

    def get_manUnit(self, pt):
        """Return the attributes of the management unit assocated with the provided point.

        Arguments:
        - `pt`:
        """
        key = "{}-{}".format(pt[0], pt[1])
        return self.point_polygons.get(key, {}).get("manUnit", "")

    def get_grid10(self, pt):
        """Return the attributes of the 10-minute grid assocated with the provided point.

        Arguments:
        - `pt`:
        """
        key = "{}-{}".format(pt[0], pt[1])
        return self.point_polygons.get(key, {}).get("grid10", "")

    # point_polygons.get_lake(pt)
    # point_polygons.get_stateprov(pt)
    # point_polygons.statdist(pt)
    # point_polygons.get_grid10(pt)


# def get_point_polygon_dictionary(events):
#     """Given a list of stocking events - return a dictionary contain the
#     attrubutes of the containing polygons for lake, jurisdtion,
#     management unit (stat district), and grid.  Duplicte coordinates
#     are removed.  The dictionary is keyed by a string of the form lat-lon.

#     The dictionary is used in the xls_upload validation to ensure that
#     associated spatial widgets on each row are consistent with their
#     coordinates.

#     """
#     coords = {(x["longitude"], x["latitude"]) for x in events}
#     point_polygons = {}
#     for xy in coords:
#         pt = Point(xy[0], xy[1], srid=4326)
#         key = "{}-{}".format(xy[1], xy[0])
#         point_polygons[key] = get_polygons(pt)
#     return point_polygons


def to_lake_dict(object_list, has_id=False):
    """A little helper function that takes a list of objects and returns a
    dictionary of lists. The first element of each list is used to
    create the key for the dictionary, the element second is added to
    the list for that key value.  Used to create lake specific list of
    stat_districts and grids.

    object_list = [['ER', ('er_1003', '1003')],
                   ['ER', ('er_1004', '1004')],
                   ['ER', ('er_1005', '1005')]]

    Returns: {"ER": [
    ('er_1003', '1003'),
    ('er_1004', '1004'),
    ('er_1005', '1005')
    ], "HU":[...]
    }

    Arguments:
    - `object_list`:

    """

    object_dict = {}
    for item in object_list:
        values = object_dict.get(item[0])
        if values:
            values.append(item[1])
        else:
            values = [item[1]]
        object_dict[item[0]] = values

    if has_id is False:
        # convert our flat lists into lists of two element tuples repeating
        # the first element
        for key, value in object_dict.items():
            tmp = [(x, x) for x in value]
            object_dict[key] = tmp

    return object_dict


def make_mu_id_lookup(mus):
    """a function that lakes of list of management unit objects and
    returns a dictionary of dictionaryies that are keyed first by lake ,
    and then by management unit label.

    mus = ManagementUnit.objects.values_list(
    "id", "slug", "lake__abbrev", "label")

    This:
    (12, 'hu_mu_mh3', 'HU', 'MH3')
    (13, 'hu_mu_mh4', 'HU', 'MH4')
    (14, 'hu_mu_mh5', 'HU', 'MH5')
    (15, 'hu_mu_mh6', 'HU', 'MH6')
    (16, 'er_mu_mich', 'ER', 'MICH')
    (38, 'er_mu_ny', 'ER', 'NY')
    (39, 'er_mu_o1', 'ER', 'O1')
    (40, 'er_mu_o2', 'ER', 'O2')
    (41, 'er_mu_o3', 'ER', 'O3')

    becomes this:
    {"HU": {"MH3":12,"MH4": 13,...}, "ER": {"NY":16}, ...}

    """
    mu_lookup = {}
    for mu in mus:
        lake_abbrev = mu[2]
        items = mu_lookup.get(lake_abbrev)
        if items:
            # label:id
            items[mu[3]] = mu[0]
        else:
            items = {mu[3]: mu[0]}
        mu_lookup[lake_abbrev] = items
    return mu_lookup


def toLookup(object_list):
    """A helper function that take a list of two element objects and
    returns a dictionary that uses the second element as the key. The
    returned dictionary can be used find the id of an object based on the
    key passed in. Reduces the number of database queries to one.

    the items in the object list should be of the format:
    ("id","value"). the returned dictionary can then be used as
    foo['value'] to quickly return the associated id.

    """
    return {x[1]: x[0] for x in object_list}


def toChoices(object_list):
    """A function to format a list of objects to a list of two-element
    tuples expected by django select widgets.  Of the form ('value','display')"""
    if len(object_list[0]) == 2:
        return [(x[1], x[1]) for x in object_list]
    else:
        return [(x[1], x[2]) for x in object_list]


def list2dict(values_list):
    """A super simple function that takes a list of two element iterables
    and returns a dictionary of lists keyed by the first element.

        This: [("A","1"), ("A","2"), ("B","1"), ("C","1")]

        Becomes: {"A": ["1", "2"], "B": ["1"], "C": ["1"] }

        Arguments:
        - `values_list`: list of two element lists or tuples.

    """
    dictionary = dict()
    for x in values_list:
        elements = dictionary.get(x[0])
        if elements:
            elements.append(x[1])
            dictionary[x[0]] = elements
        else:
            dictionary[x[0]] = [
                x[1],
            ]
    return dictionary


def make_strain_id_lookup(object_list):
    """a function that lakes of list of strain objects and returns a
    dictionary of dictionaries that are keyed first by species, and
    then raw strain value.

    strains = StrainRaw.objects.values_list("id", "species__abbrev", "strain__strain_code")

    This:

    [(45, 'ATS', 'TUND'),
    (278, 'ATS', 'UNKN'),
    (46, 'ATS', 'WR-W'),
    (283, 'BKT', ''),
    (47, 'BKT', '*')....]

    becomes this:
    {"ATS": {"TUND":45,"UNKN": 278,...}, "BKT": {"":283, "*": 47}, ...}

    """
    lookup = {}
    for mu in object_list:
        top_key = mu[1]
        items = lookup.get(top_key)
        if items:
            # label:id
            items[mu[2]] = mu[0]
        else:
            items = {mu[2]: mu[0]}
        lookup[top_key] = items
    return lookup


def getOverlap(a, b):
    """Return the overlap of two ranges. If the values of a overlap with
    the values of b are mutually exclusive then return 0"""
    return max(0, 1 + min(a[1], b[1]) - max(a[0], b[0]))


def check_ranges(range_dict, key, range):
    """give an diction that contains ranges by key, find out if the passed
    in range, overlaps with any existing ranges for that key. If no key is
    found create it. If no overlap is found, return the range dict with the
    new range added.

    returns a two element tuple - the first is a boolean indicating
    whether or not there is overlap (True - there is overlap, False -
    they are indepentent.)

    """
    overlap = False
    if range_dict.get(key) is None:
        range_dict[key] = [range]
    else:
        ranges = range_dict[key]
        overlap = sum([getOverlap(x, range) for x in ranges])
        if overlap == 0:
            ranges.append(range)
            range_dict[key] = ranges
    return (bool(overlap), range_dict)


def parseFinClip(clip):
    """give a finclip string, split it into their constituent clip codes
    and return the indiviual clips as a list - used to assign
    many-to-many relationship between stocking event and finclips.

    NOTE: this assume that clips codes are ALWAYS going to be exactly
    two characters!

    """

    return [clip[i : i + 2] for i in range(0, len(clip), 2)]
