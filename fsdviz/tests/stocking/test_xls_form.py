from datetime import datetime

import pytest
from django.contrib.gis.geos import GEOSGeometry

from ...stocking.forms import XlsEventForm
from ..pytest_fixtures import stocking_event_dict


@pytest.fixture(scope="module")
def xls_choices():
    """"""
    choices = {
        "lakes": [("HU", "HU")],
        "agencies": [("MNRF", "MNRF")],
        "state_prov": [("ON", "ON")],
        "stat_dist": [("NC2", "NC2"), ("MM4", "MM4")],
        "species": [("LAT", "Lake Trout")],
        "strain": [("SLW", "Slate Wild"), ("WI", "Wild")],
        "lifestage": [("y", "yearling")],
        "condition": [(1, 1)],
        "stocking_method": [("b", "boat")],
        "finclips": [("AD", "AD")],
        "grids": [("214", "214"), ("999", "999")],
        "tag_types": [("FT", "FT")],
        "physchem_marks": [("OX", "OX")],
        "hatcheries": [("CFCS", "CFCS")],
    }

    return choices


@pytest.fixture(scope="module")
def cache():
    """"""
    cache = {
        "mus": {"ON": ["NC2", "NC2"]},
        "lake": "HU",
        "strains": {"LAT": {"SLW": 45, "Slate Wilde": 278}},
        "mu_grids": {"NC2": ["214"]},
        # "point_polygons":
    }
    return cache


@pytest.mark.django_db
def test_xlseventform_good_data(stocking_event_dict, xls_choices, cache):
    """If we pass in a complete, valid dataset that matches all of our
    choices, our form will be valid.

    """

    data = stocking_event_dict
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is True


choice_fields = [
    "state_prov",
    "stat_dist",
    "grid",
    "species",
    "strain",
    "stage",
    "finclip",
    "condition",
    "stock_meth",
    "physchem_mark",
    "tag_type",
    "hatchery",
]


@pytest.mark.django_db
@pytest.mark.parametrize("field_name", choice_fields)
def test_xlseventform_invalid_select(
    stocking_event_dict, xls_choices, cache, field_name
):
    """If we pass in a data set that has a choice field that is not in the
    list fo valid choices, the form will not be valid, and an appropriate
    error should be created.

    This test is parameterized to accept a list of fields that use
    choices.  For each iteration, the data in the dictionary is
    updated to a invalid value ("fake") and then submitted to the
    form.

    """

    data = stocking_event_dict
    data[field_name] = "fake"
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)

    status = form.is_valid()
    assert status is False

    error_message = form.errors[field_name]
    expected = "Select a valid choice. fake is not one of the available choices."
    assert expected in error_message


required_fields = [
    "state_prov",
    "year",
    "stat_dist",
    "grid",
    "site",
    "species",
    "strain",
    "stage",
    "stock_meth",
    "no_stocked",
]


@pytest.mark.django_db
@pytest.mark.parametrize("field_name", required_fields)
def test_xlseventform_missing_required_field(
    stocking_event_dict, xls_choices, cache, field_name
):
    """If we pass in a data set that is missing a required filed, the form
    will not be valid, and an appropriate error should be created.

    This test is parameterized to accept a list of fields that are
    flagged as required.  For each iteration, the data in the
    dictionary is updated to None and then submitted to the form,
    which should be invalid and return a meaningful error message.

    """

    data = stocking_event_dict
    data[field_name] = None
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is False

    error_message = form.errors[field_name]
    expected = "This field is required."
    assert expected in error_message


invalid_dates = [
    (2017, 2, 29, False),  # not a leap year
    (2016, 2, 30, False),
    (2015, 2, 31, False),
    (2014, 4, 31, False),
    (2013, 6, 31, False),
    (2012, 9, 31, False),
    (2011, 11, 31, False),
    # valid dates
    (2016, 2, 29, True),  # a leap year
    (2016, 2, 28, True),
    (2015, 3, 30, True),
    (2014, 4, 30, True),
    (2013, 6, 30, True),
    (2012, 9, 30, True),
    (2011, 11, 30, True),
]


@pytest.mark.django_db
@pytest.mark.parametrize("year, month, day, valid", invalid_dates)
def test_xlseventform_valid_invalid_dates(
    stocking_event_dict, xls_choices, cache, year, month, day, valid
):
    """If the stocking event data contains day, month and year, and forms
    a valid date (including leap years), the form should be valid, if
    day month and year do not form a valid data - either because the
    day is on the 31 of a month with 30 days, is Feb 29 on a non-leap
    year, or is our of range for days or months, the form should be
    invalid and return a meaningful error message.

    This test is parameterized to accept a list of day, month, year
    combinations and the expected status of the form. If the form is
    invalid, it should contain a meaningful error message.

    """

    data = stocking_event_dict
    data["year"] = year
    data["month"] = month
    data["day"] = day
    # make sure to keep year class valid:
    data["year_class"] = year - 1
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is valid

    if status is False:
        expected = "Day, month, and year do not form a valid date."
        error_messages = [x[1][0] for x in form.errors.items()]
        assert expected in error_messages

    # todo: check error message


invalid_dates = [(2013, 6, 50), (2011, 11, -30), (2011, 11, 0)]


@pytest.mark.django_db
@pytest.mark.parametrize("year, month, day", invalid_dates)
def test_xlseventform_day_out_of_range(
    stocking_event_dict, xls_choices, cache, year, month, day
):
    """If the stocking event data contains day that is >31 or less than 1,
    the form will not be valid and an error will be thrown.

    This test is parameterized to accept a list of day, month, year
    combinations If the form is invalid, it should contain a
    meaningful error message.

    """

    data = stocking_event_dict
    data["year"] = year
    data["month"] = month
    data["day"] = day
    # make sure to keep year class valid:
    data["year_class"] = year - 1
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Select a valid choice. {} is not one of the available choices."
    assert expected.format(day) in error_messages


invalid_dates = [(2013, 16, 15), (2011, -11, 30), (2011, 0, 15)]


@pytest.mark.django_db
@pytest.mark.parametrize("year, month, day", invalid_dates)
def test_xlseventform_month_out_of_range(
    stocking_event_dict, xls_choices, cache, year, month, day
):
    """If the stocking event data contains month that is >12 or less than 1,
    the form will not be valid and an error will be thrown.

    This test is parameterized to accept a list of day, month, year
    combinations If the form is invalid, it should contain a
    meaningful error message.

    """

    data = stocking_event_dict
    data["year"] = year
    data["month"] = month
    data["day"] = day
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Select a valid choice. {} is not one of the available choices."
    assert expected.format(month) in error_messages


@pytest.mark.django_db
def test_xlseventform_wrong_grid(stocking_event_dict, cache, xls_choices):
    """If the provided grid cannot be found in the lake, the form
    should be invalid, and a meaningful error message should be
    produced.
    """

    data = stocking_event_dict
    data["grid"] = "999"
    stat_dist = data.get("stat_dist")
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Grid {} is not valid for Statistical District '{}'".format(
        999, stat_dist
    )
    assert expected in error_messages


@pytest.mark.django_db
def test_xlseventform_wrong_stat_dist(stocking_event_dict, xls_choices, cache):
    """If the provided stat_dist cannot be found in the lake, the form
    should be invalid, and a meaningful error message should be
    produced.

    This test requires a stat district that actually exists, but it
    not in the same lake as our stocking event.

    """

    data = stocking_event_dict
    data["stat_dist"] = "MM4"
    lake = data.get("lake")
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Stat_Dist {} is not valid for ON waters of Lake {}".format("MM4", lake)
    assert expected in error_messages


outOfBounds_latlongs = [
    (44.5, -81.5, "", 0),  # valid -  within bbox
    (42.5, -81.5, "Latitude must be greater than {:.3f} degrees", 1),
    (46.5, -81.5, "Latitude must be less than {:.3f} degrees", 3),
    (44.5, -83.5, "Longitude must be negative and greater than {:.3f} degrees", 0),
    (44.5, -79.5, "Longitude must be negative and less than {:.3f} degrees", 2),
]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "ddlat, ddlon, expected_message, bbox_idx", outOfBounds_latlongs
)
def test_latlon_out_of_bounds_lake(
    stocking_event_dict, xls_choices, cache, ddlat, ddlon, expected_message, bbox_idx
):
    """we need to make sure taht every submitted event falls within a
    buffered bounding box.  if the lat or the long are outside those
    buonds, we need to raise an error.

    """

    geom_wkt = (
        "MULTIPOLYGON(((-81.00 44.0,"
        + "-82.00 44.0,"
        + "-82.00 45.0,"
        + "-81.00 45.0,"
        + "-81.00 44.0)))"
    )
    geom = GEOSGeometry(geom_wkt.replace("\n", ""), srid=4326)

    bbox = geom.extent

    data = stocking_event_dict

    data["latitude"] = ddlat
    data["longitude"] = ddlon

    cache["bbox"] = bbox
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()

    if expected_message == "":
        assert status is True
    else:
        assert status is False
        error_messages = [x[1][0] for x in form.errors.items()]
        # ppulate our error message with the corresponding value in the bbox:
        msg = expected_message.format(bbox[bbox_idx])
        assert msg in error_messages


def test_latlong_wrong_jurisdiction():
    """"""
    assert 0 == 1


def test_latlong_wrong_stat_dist():
    """"""
    assert 0 == 1


def test_latlong_wrong_grid():
    """"""
    assert 0 == 1


missing_latlongs = [
    (None, -81.5, "Latitude is required if Longitude is populated"),
    (44.5, None, "Longitude is required if Latitude is populated"),
]


@pytest.mark.django_db
@pytest.mark.parametrize("ddlat, ddlon, expected_message", missing_latlongs)
def test_missing_lat_or_lon(
    stocking_event_dict, xls_choices, cache, ddlat, ddlon, expected_message
):
    """Lat and lon either need to both be provided, or neither can be
    provided, if just one is included, throw an error

    """
    data = stocking_event_dict

    data["latitude"] = ddlat
    data["longitude"] = ddlon

    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]

    assert expected_message in error_messages


valid_cwts = [
    "631234",
    "631512,635978",
    "631512,635978,639845",
    "631512;635978",
    "631512;635978;639845",
    "631512;635978,639845",
]


@pytest.mark.django_db
@pytest.mark.parametrize("value", valid_cwts)
def test_valid_cwts(stocking_event_dict, xls_choices, cache, value):
    """These are all valid cwt patterns that should be considered valid and pass."""
    data = stocking_event_dict
    data["tag_no"] = value
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()

    error_messages = [x[1][0] for x in form.errors.items()]
    print(error_messages)

    assert status is True


invalid_cwts = [
    "31234",
    "51234",
    "6312AB",
    "6051234",
    "63-12-34",
    "63-12-",
    "6631234",
    "631512,35978",
    "631512,6635978,639845",
    "631512;63978",
    "631512;6359978;639845",
    "631512;6359798,639845",
    "631512;63597,639845",
    "631512;63597,639",
]


@pytest.mark.django_db
@pytest.mark.parametrize("value", invalid_cwts)
def test_invalid_cwts(stocking_event_dict, xls_choices, cache, value):
    """These are all invalid cwt patterns that should be considered invalid and pass."""
    data = stocking_event_dict
    data["tag_no"] = value
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is False

    errmsg = (
        "Each CWT must be 6 digits (including leading 0's)."
        + " Multiple cwts must be separated by a comma"
    )
    observed_messages = [x[1][0] for x in form.errors.items()]

    assert errmsg in observed_messages


invalid_clips = [
    ("BP", "'BP' is not a valid composite clip.  Did you mean 'LPRP'?"),
    ("BV", "'BV' is not a valid composite clip.  Did you mean 'LVRV'?"),
    ("ADBV", "'BV' is not a valid composite clip.  Did you mean 'LVRV'?"),
]


@pytest.mark.parametrize("clip, errmsg", invalid_clips)
def test_illegal_finclip(stocking_event_dict, xls_choices, cache, clip, errmsg):
    """BV and BP are shorthand clips codes that have been used in the past
    but are inconcistent with the convention of concatenating fin
    clips together.  This test verifies that they will be flagged even
    if they are included in the choices dictionary."""

    choices = xls_choices

    choices["finclips"] = [
        ("AD", "AD"),
        ("BV", "BV"),
        ("BP", "BP"),
        ("ADBV", "ADBV"),
    ]

    data = stocking_event_dict
    data["finclip"] = clip
    form = XlsEventForm(data=data, choices=choices, cache=cache)
    status = form.is_valid()
    assert status is False
    observed_messages = [x[1][0] for x in form.errors.items()]
    assert errmsg in observed_messages


@pytest.mark.django_db
def test_strain_within_species(
    stocking_event_dict,
    xls_choices,
    cache,
):
    """The selected strain must exist for the selectd species - if it does
    not, raise and error and return a meaninful message.

    In this case, WI is a strain code that is in the dropdown list,
    but is not associated with our species in the cache - we should get an error.

    """
    data = stocking_event_dict
    strain = "WI"
    data["strain"] = strain
    form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
    status = form.is_valid()
    assert status is False

    species = data["species"]
    errmsg = "Unknown strain code '{}' for species '{}'".format(strain, species)
    observed_messages = [x[1][0] for x in form.errors.items()]
    assert errmsg in observed_messages


thisyear = datetime.now().year
numeric_fields = [
    (
        "year",
        [-10, 1900, 2032, "foo"],
        [
            "Ensure this value is greater than or equal to 1950.",
            "Ensure this value is greater than or equal to 1950.",
            "Ensure this value is less than or equal to {}.".format(thisyear),
            "Enter a whole number.",
        ],
    ),
    (
        "month",
        [-10, 13, "foo"],
        [
            "Select a valid choice. -10 is not one of the available choices.",
            "Select a valid choice. 13 is not one of the available choices.",
            "Select a valid choice. foo is not one of the available choices.",
        ],
    ),
    (
        "day",
        [-10, 0, 32, "foo"],
        [
            "Select a valid choice. -10 is not one of the available choices.",
            "Select a valid choice. 0 is not one of the available choices.",
            "Select a valid choice. 32 is not one of the available choices.",
            "Select a valid choice. foo is not one of the available choices.",
        ],
    ),
    (
        "no_stocked",
        [-10, 0, 0.5, "foo"],
        [
            "Ensure this value is greater than or equal to 1.",
            "Ensure this value is greater than or equal to 1.",
            "Enter a whole number.",
            "Enter a whole number.",
        ],
    ),
    (
        "year_class",
        [-10, 10, 1900, "foo", 2050],
        [
            "Ensure this value is greater than or equal to 1950.",
            "Ensure this value is greater than or equal to 1950.",
            "Ensure this value is greater than or equal to 1950.",
            "Enter a whole number.",
            "Ensure this value is less than or equal to {}.".format(thisyear + 1),
        ],
    ),
    (
        "agemonth",
        [-10, "foo", "8,3"],
        [
            "Ensure this value is greater than or equal to 0.",
            "Enter a whole number.",
            "Enter a whole number.",
        ],
    ),
    (
        "clip_efficiency",
        [-10, 101, "foo", "8,9"],
        [
            "Ensure this value is greater than or equal to 0.",
            "Ensure this value is less than or equal to 100.",
            "Enter a number.",
            "Enter a number.",
        ],
    ),
    (
        "tag_ret",
        [-10, 101, "foo", "8,9"],
        [
            "Ensure this value is greater than or equal to 0.",
            "Ensure this value is less than or equal to 100.",
            "Enter a number.",
            "Enter a number.",
        ],
    ),
    (
        "length",
        [-10, -1, "foo", "8,9"],
        [
            "Ensure this value is greater than or equal to 1.",
            "Ensure this value is greater than or equal to 1.",
            "Enter a number.",
            "Enter a number.",
        ],
    ),
    (
        "weight",
        [-10, -1, "foo", "8,9"],
        [
            "Ensure this value is greater than or equal to 0.1.",
            "Ensure this value is greater than or equal to 0.1.",
            "Enter a number.",
            "Enter a number.",
        ],
    ),
]


@pytest.mark.parametrize("field", numeric_fields)
@pytest.mark.django_db
def test_invalid_field_values(stocking_event_dict, xls_choices, cache, field):
    """If we pass a dictionary with a value that is outside of the valid
    range or of the incorrect type for that field, we should get a
    meaningful error message.

    For example, invalid values for year include: -10, 1900, 2032, foo

    """
    field_name = field[0]
    values = field[1]
    messages = field[2]

    data = stocking_event_dict
    for val, msg in zip(values, messages):
        data[field_name] = val
        form = XlsEventForm(data=data, choices=xls_choices, cache=cache)
        status = form.is_valid()
        assert status is False
        error_message = form.errors[field_name]
        assert msg in error_message
