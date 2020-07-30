"""=============================================================
~/fsdviz/fsdviz/tests/pytest_fixtures.py
 Created: 28 Aug 2019 11:09:58

 DESCRIPTION:

This file contains a number of fixtures or objects that are used by
our testing utilities.  The object include a user, a dictionary
representing a complete xlsx stocking event, and a list of invalid
excel files and associated error messages.  These objects are included
here because they are used in several other places.

 A. Cottrill
=============================================================

"""


import pytest
from .user_factory import UserFactory
from django.contrib.gis.geos import GEOSGeometry

from .common_factories import LatLonFlagFactory

from fsdviz.common.choices import LATLON_FLAGS

SCOPE = "function"


@pytest.fixture(scope=SCOPE)
def user(db):
    """return a normal user named homer
    """
    password = "Abcd1234"
    homer = UserFactory.create(
        username="hsimpson", first_name="Homer", last_name="Simpson", password=password
    )
    homer.save()
    return homer


@pytest.fixture
def roi():
    """a region of interest that can be used in all of our tests.  Uses
    corrdinates of grid 2826, a 5-minute grid in the middle of Lake
    Huron located at the intersection of 44 degrees latitude and 82
    degrees longitude..

    inside the ROI: 'POINT(-82.0456637754061 44.0649121962459)'
    outside the ROI: POINT'(-79.152543, 43.603609)'

    """
    grid = (
        "MULTIPOLYGON(((-82.000000033378 43.9999999705306,"
        + "-82.0833359084557 43.9999999705305,"
        + "-82.0833359084557 44.0833320331081,"
        + "-82.000000033378 44.0833320331082,"
        + "-82.000000033378 43.9999999705306)))"
    )
    roi = GEOSGeometry(grid.replace("\n", ""), srid=4326)

    return roi


@pytest.fixture(scope="function")
def latlon_flags():
    """populate the database with our latlon choices.
    """

    flags = [LatLonFlagFactory(value=x[0], description=x[1]) for x in LATLON_FLAGS]
    return flags


@pytest.fixture(scope="function")
def stocking_event_dict():
    """return a dictionary representing a complete, valid upload event.
    This dictionary is used directly to represent a stocking event, or
    is modified to verify that invalid data is handled appropriately.

    """

    event_dict = {
        "stock_id": None,
        "lake": "HU",
        "state_prov": "ON",
        "year": 2015,
        "month": 4,
        "day": 20,
        "site": "Barcelona",
        "st_site": None,
        "latitude": 42.3422418,
        "longitude": -79.5962906,
        "grid": "214",
        "stat_dist": "NC2",
        "species": "LAT",
        "strain": "SLW",
        "no_stocked": 18149,
        "year_class": 2014,
        "stage": "y",
        "agemonth": 18,
        "mark": "ADCWT",
        "mark_eff": 99.5,
        "tag_no": 640599,
        "tag_ret": 99,
        "length": 107.44,
        "weight": 563.8153159,
        "condition": 1,
        "lot_code": "LAT-SLW-13",
        "stock_meth": "b",
        "agency": "MNRF",
        "notes": "FIS ID = 73699",
        # new
        "hatchery": "CFCS",
        "agency_stock_id": "P1234",
    }

    return event_dict


# our list of invalid spreadsheets and their associated messages
invalid_xlsfiles = [
    (
        "fsdviz/tests/xls_files/two_agencies.xlsx",
        (
            "The uploaded file has more than one agency. "
            + " Data submissions are limited to a single year, species, and agency. "
        ),
    ),
    (
        "fsdviz/tests/xls_files/two_lakes.xlsx",
        (
            "The uploaded file has more than one lake. "
            + " Data submissions are limited to a single year, species, and agency. "
        ),
    ),
    (
        "fsdviz/tests/xls_files/two_years.xlsx",
        (
            "The uploaded file has more than one year. "
            + " Data submissions are limited to a single year, species, and agency. "
        ),
    ),
    (
        "fsdviz/tests/xls_files/too_many_records.xlsx",
        "Uploaded file has too many records. Please split it into"
        + "smaller packets (e.g by species).",
    ),
    (
        "fsdviz/tests/xls_files/empty_template.xlsx",
        "The uploaded file does not appear to contain any stocking records!",
    ),
    (
        "fsdviz/tests/xls_files/missing_one_field.xlsx",
        (
            "The uploaded file appears to be missing the field: year_class. "
            + "This field is required in a valid data upload template."
        ),
    ),
    (
        "fsdviz/tests/xls_files/missing_two_fields.xlsx",
        (
            "The uploaded file appears to be missing the fields: stage, year_class. "
            + "These fields are required in a valid data upload template."
        ),
    ),
    (
        "fsdviz/tests/xls_files/one_extra_field.xlsx",
        (
            "The uploaded file appears to have an additional field: extraA. "
            + "This field was ignored."
        ),
    ),
    (
        "fsdviz/tests/xls_files/two_extra_fields.xlsx",
        (
            "The uploaded file appears to have 2 additional field(s): extraA, extraB. "
            + "These fields were ignored."
        ),
    ),
]
