"""=============================================================
~/fsdviz/fsdviz/tests/test_stocking_event_form.py
 Created: 20 Jan 2020 15:03:19

 DESCRIPTION:

This file contains a large number of tests to verify that the stocking
event form works as expected. The tests are layed out in this file, is
an order that closely emulates the order that the field appear on the
html page.  A global 'event' dictionary contains a complete, valid
data submission that is then changed to verify that the change is
captured and handled appropriately.

 A. Cottrill
=============================================================

"""

import pytest
from datetime import datetime

from ...stocking.utils import get_event_model_form_choices
from ...stocking.forms import StockingEventForm

from ..factories.stocking_factories import StockingEventFactory
from ..factories.common_factories import FishTagFactory, FinClipFactory

from ..pytest_fixtures import glsc, huron, mdnr
from ..pytest_fixtures import huron_mdnr_sc as agency_sc

SCOPE = "function"


def create_event_dict(event):
    """

    Arguments:
    - `event`:
    """
    event_dict = event.__dict__

    omit = [
        "jurisdiction_id",
        "geom",
        "created_date",
        "modified_date",
        "yreq_stocked",
        "grid_5",
        "upload_event_id",
    ]
    for fld in omit:
        event_dict.pop(fld)

    event_dict["lake_id"] = event.jurisdiction.lake.id
    event_dict["state_prov_id"] = event.jurisdiction.stateprov.id
    return event_dict


@pytest.fixture(scope=SCOPE, name="event")
def stocking_event(db):
    """return a basic stocking event that will be used by all of our tests."""
    event = StockingEventFactory()

    return event


@pytest.mark.django_db
def test_complete_valid_data(event, glsc):
    """If we pass a dictionary with complete data, the form should be valid."""

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)
    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is True


choice_fields = [
    # (field_id, choice_key),
    ("agency_id", "agencies"),
    ("lake_id", "lakes"),
    ("state_prov_id", "state_provs"),
    ("species_id", "species"),
    ("lifestage_id", "lifestages"),
    ("condition_id", "conditions"),
    ("stocking_method_id", "stocking_methods"),
    ("grid_10_id", "grids"),
    ("strain_raw_id", "strains"),
    ("management_unit_id", "managementUnits"),
]


@pytest.mark.parametrize("field", choice_fields)
@pytest.mark.django_db
def test_invalid_choices(event, field, glsc):
    """This test verifies that the form returns a meaningful message if
    one of the choice fields contains an invalid choice. It takes a
    parameter that consists of a two element tuple containing the
    field_id, and the choice key.  The choice key is used get the real
    value and create a corrupt one that is sent to the form.

    """

    field_name = field[0]
    choice_key = field[1]

    choices = get_event_model_form_choices(event)

    event_dict = create_event_dict(event)

    # get the first element of the first list in agencies
    new_choice = choices[choice_key][0][0] + 10
    event_dict[field_name] = new_choice

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is False
    error_message = form.errors[field_name]
    expected = "Select a valid choice. {} is not one of the available choices."

    assert expected.format(new_choice) in error_message


required_fields = [
    "agency_id",
    "species_id",
    "strain_raw_id",
    "year",
    "lake_id",
    "state_prov_id",
    "management_unit_id",
    "grid_10_id",
    "site",
    "no_stocked",
    "stocking_method_id",
    "year_class",
    "lifestage_id",
]


@pytest.mark.parametrize("field_name", required_fields)
@pytest.mark.django_db
def test_missing_required_field(event, field_name, glsc):
    """This test verifies that the form returns a meaningful message if
    one of the required fields is not populated. It is parameterized
    to take a list of requried field names, then submit the form with
    each field missing.  For each field, it asserts that an
    appropriate error message is returned.

    """

    choices = get_event_model_form_choices(event)

    event_dict = create_event_dict(event)

    # get the first element of the first list in agencies

    event_dict[field_name] = None

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is False
    error_message = form.errors[field_name]

    expected = "This field is required."
    assert expected in error_message


optional_fields = [
    "site_type",
    "agemonth",
    "mark",
    "mark_eff",
    # "clip", #SOME DAY
    "tag_no",
    "tag_ret",
    "length",
    "weight",
    "condition",
    "validation",
]


@pytest.mark.parametrize("field_name", optional_fields)
@pytest.mark.django_db
def test_missing_optional_field(event, field_name, glsc):
    """This test verifies that the form is still valid if the optional
    fields are not provided. It is parameterized to take a list of
    requried field names, then submit the form with each field
    missing.  The form should always be valid.

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    # get the first element of the first list in agencies

    event_dict[field_name] = None

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is True


# ==========================================
#         TEMPORAL FIELDs

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
        [-10, 0, 13, "foo"],
        [
            "Select a valid choice. -10 is not one of the available choices.",
            "Select a valid choice. 0 is not one of the available choices.",
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
        [-10, 10, 1900, "foo"],
        [
            "Ensure this value is greater than or equal to 1950.",
            "Ensure this value is greater than or equal to 1950.",
            "Ensure this value is greater than or equal to 1950.",
            "Enter a whole number.",
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
        "mark_eff",
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
        [-10, -1, 0.5, "foo", "8,9"],
        [
            "Ensure this value is greater than or equal to 1.",
            "Ensure this value is greater than or equal to 1.",
            "Enter a whole number.",
            "Enter a whole number.",
            "Enter a whole number.",
        ],
    ),
    (
        "weight",
        [-10, -1, 0, "foo", "8,9"],
        [
            "Weight is optional, but must be greater than or equal to 0.01.",
            "Weight is optional, but must be greater than or equal to 0.01.",
            "Weight is optional, but must be greater than or equal to 0.01.",
            "Enter a number greater than or equal to 0.01.",
            "Enter a number greater than or equal to 0.01.",
        ],
    ),
]


@pytest.mark.parametrize("field", numeric_fields)
@pytest.mark.django_db
def test_invalid_field_values(event, field, glsc):
    """If we pass a dictionary with a value that is outside of the valid
    range or of the incorrect type for that field, we should get a
    meaningful error message.

    For example, invalid values for year include: -10, 1900, 2032, foo

    """
    field_name = field[0]
    values = field[1]
    messages = field[2]

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    for val, msg in zip(values, messages):
        event_dict[field_name] = val
        form = StockingEventForm(event_dict, choices=choices, user=glsc)
        status = form.is_valid()

        assert status is False
        error_message = form.errors[field_name]
        assert msg in error_message


@pytest.mark.django_db
def test_agency_select_disabled_for_agency_coordinator(event, agency_sc):
    """Agency stocking coordinators should only be able to edit stocking
    events associated with their agency - they shouldn't be able to change
    the agency associated with an event (ie. - give it to anohter
    agency). If they did, they would not be able to edit it again.

    The agency select widget should be reaonly, and limited to the
    agency associated with the agency coordinator.

    Arguments:
    - `event`:
    - `agency_sc`:

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    form = StockingEventForm(event_dict, choices=choices, user=agency_sc)

    agency_field = form.fields.get("agency_id")
    assert len(agency_field.choices) == 1
    choices_id = agency_field.choices[0][0]
    assert choices_id == agency_sc.agency.id

    assert agency_field.widget.attrs["readonly"] is True


@pytest.mark.django_db
def test_lake_select_limited_for_agency_coordinator(event, agency_sc):
    """Agency stocking coordinators should only be able to edit stocking
    events associated with the lakes that they are associated with -
    they shouldn't be able to change the lake associated with an event
    (ie. - move it to another lake). If they did, they would not be
    able to edit it again.

    The lake select widget should be limited to the lakes associated
    with the agency coordinator who is using the form, but should not
    be disabled or readonly.

    Arguments:
    - `event`:
    - `agency_sc`:

    """
    # get a list of lake ids associated with our agency stocking coordinator:
    user_lake_ids = [x.id for x in agency_sc.lakes.all()]

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    form = StockingEventForm(event_dict, choices=choices, user=agency_sc)

    lake_field = form.fields.get("lake_id")

    assert len(lake_field.choices) == len(user_lake_ids)

    choices_id = lake_field.choices[0][0]
    assert choices_id in user_lake_ids

    assert lake_field.disabled is False
    assert lake_field.widget.attrs.get("readonly") is None


@pytest.mark.django_db
def test_missing_month_no_day(event, glsc):
    """If we pass a dictionary that has an empty month id, an missing day value,
    the record should be created without issue.

    OK

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["month"] = None
    event_dict["day"] = None

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is True


@pytest.mark.django_db
def test_missing_month_with_day(event, glsc):
    """If we pass a dictionary that has an empty month id, but a day value
    has been provided should get a meaningful error message.

    ERROR

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["month"] = None

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is False
    # assert error messages
    # month is required if day id provided:
    msg = "Please provide a month to complete the event date."
    assert msg in form.errors["__all__"]


@pytest.mark.django_db
def test_missing_day(event, glsc):
    """If we pass a dictionary that has an empty day value, the form
    should still be valid.

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["day"] = None

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is True


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
def test_invalid_date(event, glsc, year, month, day, valid):
    """If we pass a dictionary with day, month and year values that form
    an invalid date,  should get a meaningful error message.

    invalid values include: 1900-10-10, 2000-04-31, 2050-10-10.

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["year"] = year
    event_dict["month"] = month
    event_dict["day"] = day

    # ensures that year_class doesn throw an error.
    event_dict["year_class"] = year

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is valid

    if status is False:
        expected = "Day, month, and year do not form a valid date."
        error_messages = [x[1][0] for x in form.errors.items()]
        assert expected in error_messages


# # ==========================================
# #         SPATIAL FIELDs


# # test
# # lat long flag


@pytest.mark.xfail
@pytest.mark.django_db
def test_missing_stat_district_with_grid10(event, glsc):
    """If we pass a dictionary that has an empty stat_district id,
    but a grid10 value as provided, we should get a meaningful error message.

    NOTE: this test requires more setup to ensure spatial attributes are correct.

    ERROR.

    """
    assert 0 == 1


@pytest.mark.xfail
@pytest.mark.django_db
def test_missing_grid10_no_latlon(event, glsc):
    """If we pass a dictionary that has an empty grid10 id, and null
    lat-lon, the record should be created without issue, but the latlon
    flag should be set.

     (Grid10 is currently a required field)

     OK

    """
    assert 0 == 1


@pytest.mark.xfail
@pytest.mark.django_db
def test_missing_grid10_with_latlon(event, glsc):
    """If we pass a dictionary that has an empty grid10 id, and latlong
    was also provided, grid is a required field and should be
    consistent with the supplied coordinates.

    NOTE: this test requires more setup to ensure spatial attributes are correct.

    ERROR

    """
    assert 0 == 1


@pytest.mark.django_db
def test_missing_lat_but_no_lon(event, glsc):
    """If we pass a dictionary that has a latitude, but no longitude, we
    should be presented with a meaningful error message.

    ERROR

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["dd_lon"] = None

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is False
    # assert error messages
    msg = "Longitude is required if Latitude is provided."
    assert msg in form.errors["__all__"]


@pytest.mark.django_db
def test_missing_lon_but_no_lat(event, glsc):
    """If we pass a dictionary that has a longitude, but no latitude, we
    should be presented with a meaningful error message.

    ERROR

    """
    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["dd_lat"] = None

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is False
    # assert error messages
    msg = "Latitude is required if Longitude is provided."
    assert msg in form.errors["__all__"]


@pytest.mark.django_db
def test_missing_latlon(event, glsc):
    """If we pass a dictionary that has no longitude or latitude, the form
    should still be valid.

    ERROR

    """
    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["dd_lat"] = None
    event_dict["dd_lon"] = None

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is True


min_lat = 41.39
max_lat = 49.1
min_lon = -92.3
max_lon = -74.35


coordinates = [
    # (ddlat, ddlon, error messages)
    (
        -81.5,
        45.5,
        {
            "dd_lat": "Ensure this value is greater than or equal to {}.".format(
                min_lat
            ),
            "dd_lon": "Ensure this value is less than or equal to {}.".format(max_lon),
        },
    ),
    (
        45.5,
        45.5,
        {"dd_lon": "Ensure this value is less than or equal to {}.".format(max_lon)},
    ),
    (
        -81.5,
        -81.5,
        {"dd_lat": "Ensure this value is greater than or equal to {}.".format(min_lat)},
    ),
    (
        45.5,
        81.5,
        {"dd_lon": "Ensure this value is less than or equal to {}.".format(max_lon)},
    ),
    (
        41.0,
        -81.5,
        {"dd_lat": "Ensure this value is greater than or equal to {}.".format(min_lat)},
    ),
    (
        49.5,
        -81.5,
        {"dd_lat": "Ensure this value is less than or equal to {}.".format(max_lat)},
    ),
    (
        45.5,
        -72.5,
        {"dd_lon": "Ensure this value is less than or equal to {}.".format(max_lon)},
    ),
    (
        45.5,
        -94.5,
        {"dd_lon": "Ensure this value is greater than or equal to {}.".format(min_lon)},
    ),
]


@pytest.mark.django_db
@pytest.mark.parametrize("dd_lat, dd_lon, messages", coordinates)
def test_coordinates_out_of_bounds(event, glsc, dd_lat, dd_lon, messages):
    """If we pass in coordinates that exceed the bounds for lat and or
    lon, we should recieve appropriate error messages.  This test is
    parameterized to recieve and array of corrdinates and the expected
    error message(s).  The coordinates represent points outside the
    Great lake basin, as well as common errors such as repeated lat or
    lon, or switched lat-lon.
    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["dd_lat"] = dd_lat
    event_dict["dd_lon"] = dd_lon

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is False

    for fld, msg in messages.items():
        assert msg in form.errors[fld]


@pytest.mark.django_db
def test_future_year_class(event, glsc):
    """If we pass a dictionary with an year_class that occurs ahead of the
    stocking year we should get a meaningful error message.

    """
    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["year_class"] = event_dict["year"] + 1

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is False

    msg = "Year class cannot be greater than stocking year."
    assert msg in form.errors["__all__"]


# # clip - optional (required if clip efficency is populated). Must be valid string
# @pytest.mark.django_db
# def test_invalid_clip(event, glsc):
#     """If we pass a dictionary with an clip that does not exist, we
#     should get a meaningful error message.

#      NOTE: CLIP has not been added to our form or database yet!

#     invalid values include: -10, foo, "8,3", ????

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_clip(event, glsc):
#     """If we pass a dictionary that has an empty clip, the record
#     should still be created.

#      NOTE: CLIP has not been added to our form or database yet!

#     OK.

#     """
#     assert 0 == 1


@pytest.mark.django_db
def test_invalid_physchem_mark(event, glsc):
    """If we pass a dictionary with an mark that does not exist, we
    should get a meaningful error message.

    invalid values include: -10, foo, "8,3", ????

    """

    choices = get_event_model_form_choices(event)

    # make sure that mark is a valid choice:
    event_dict = create_event_dict(event)
    event_dict["physchem_marks"] = ["XX"]

    form = StockingEventForm(event_dict, choices=choices, user=glsc)
    status = form.is_valid()
    assert status is False

    error_message = form.errors["physchem_marks"]
    expected = "Select a valid choice. XX is not one of the available choices."

    assert expected in error_message


@pytest.mark.django_db
def test_mark_effectiveness_without_physchem_mark(event, glsc):
    """Mark retention should be null if physchem mark is null"""
    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["mark_eff"] = 50

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is False

    msg = (
        "At least one Physical or Chemical Mark or Fin Clip must be "
        + "selected if Mark Efficiency is provided."
    )
    assert msg in form.errors["__all__"]


@pytest.mark.django_db
def test_tag_retention_without_tag(event, glsc):
    """tag retention should be null if tags is null"""

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["fish_tags"] = None
    event_dict["tag_ret"] = 50

    form = StockingEventForm(event_dict, choices=choices, user=glsc)

    status = form.is_valid()
    assert status is False

    msg = "At least one Fish Tag Type must be selected if Tag Retention is provided."
    assert msg in form.errors["__all__"]


@pytest.mark.django_db
def test_unknown_tag_code(event, glsc):
    """if unknown tag code is somehow selected, a meaningful error
    message should be returned.

    """

    choices = get_event_model_form_choices(event)

    # make sure cwt is a valid fin clip choice:
    event_dict = create_event_dict(event)
    event_dict["fish_tags"] = ["XX"]

    form = StockingEventForm(event_dict, choices=choices, user=glsc)
    status = form.is_valid()
    assert status is False

    error_message = form.errors["fish_tags"]
    expected = "Select a valid choice. XX is not one of the available choices."

    assert expected in error_message


@pytest.mark.django_db
def test_no_clip_mutally_exclusive_clip(event, glsc):
    """No clipped and unclipped are mutually exclusive of all other clips"""

    FinClipFactory.create(abbrev="AD", description="adipose clip")
    FinClipFactory.create(abbrev="NC", description="no clip")

    choices = get_event_model_form_choices(event)

    # make sure cwt is a valid fin clip choice:
    event_dict = create_event_dict(event)
    event_dict["fin_clips"] = ["AD", "NC"]

    form = StockingEventForm(event_dict, choices=choices, user=glsc)
    status = form.is_valid()
    assert status is False

    msg = '"No fin clip (NC)" cannot be combined with another fin clip.'
    assert msg in form.errors["__all__"]


@pytest.mark.django_db
def test_unknown_clip_mutally_exclusive_clip(event, glsc):
    """Unknonw Clip Status is mutually exclusive of all other clips"""

    FinClipFactory.create(abbrev="AD", description="adipose clip")
    FinClipFactory.create(abbrev="UN", description="unknown clip")

    choices = get_event_model_form_choices(event)

    # make sure cwt is a valid fin clip choice:
    event_dict = create_event_dict(event)
    event_dict["fin_clips"] = ["AD", "UN"]

    form = StockingEventForm(event_dict, choices=choices, user=glsc)
    status = form.is_valid()
    assert status is False

    msg = '"Unknown fin clip (UN)" cannot be combined with another fin clip.'
    assert msg in form.errors["__all__"]


@pytest.mark.django_db
def test_unknown_clip_code(event, glsc):
    """if unknown clip code is somehow selected, a meaningful error
    message should be returned.

    """

    FinClipFactory.create(abbrev="AD", description="adipose clip")
    FinClipFactory.create(abbrev="UN", description="unknown clip")

    choices = get_event_model_form_choices(event)

    # make sure cwt is a valid fin clip choice:
    event_dict = create_event_dict(event)
    event_dict["fin_clips"] = ["XX"]

    form = StockingEventForm(event_dict, choices=choices, user=glsc)
    status = form.is_valid()
    assert status is False

    error_message = form.errors["fin_clips"]
    expected = "Select a valid choice. XX is not one of the available choices."

    assert expected in error_message


# NOTE: this will assume that the cwts are NMT, non-sequential tags.
# If they are sequential tags or manufactured by micro mark, please
# contact the Green Bay Fisheries Station to have your events updated
# correctly.
